import { AppDataSource } from '@database/data-source';
import {
  Payment,
  Refund,
  Invoice,
  Order,
  Table,
  Customer,
  CreditAccount,
  CreditTransaction,
  LoyaltyRule,
  LoyaltyTransaction,
} from '@entities/index';
import { NotFoundError, BadRequestError } from '@shared/errors/app-error';
import {
  PaymentMethod,
  InvoiceStatus,
  OrderStatus,
  TableStatus,
  CreditTransactionType,
  LoyaltyTransactionType,
} from '@chhiyapasal/shared-types';

export class PaymentService {
  private paymentRepo = AppDataSource.getRepository(Payment);
  private invoiceRepo = AppDataSource.getRepository(Invoice);

  async processPayments(data: {
    businessId: string;
    branchId: string;
    userId: string;
    invoiceId: string;
    payments: Array<{
      paymentMethod: PaymentMethod;
      amount: number;
      referenceNumber?: string;
      notes?: string;
    }>;
  }) {
    if (!data.payments || data.payments.length === 0) {
      throw new BadRequestError('At least one payment entry is required');
    }

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const invoice = await queryRunner.manager.findOne(Invoice, {
        where: { id: data.invoiceId, business_id: data.businessId },
        relations: ['order', 'customer'],
      });

      if (!invoice) throw new NotFoundError('Invoice not found');
      if (invoice.status === InvoiceStatus.PAID) {
        throw new BadRequestError('This invoice is already fully paid');
      }
      if (invoice.status === InvoiceStatus.CANCELLED) {
        throw new BadRequestError('Cannot pay a cancelled invoice');
      }

      const totalPaidIncoming = data.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const remainingDue = Number(invoice.due_amount);

      if (totalPaidIncoming > remainingDue) {
        throw new BadRequestError(
          `Payment amount (${totalPaidIncoming}) exceeds remaining invoice due (${remainingDue})`
        );
      }

      const createdPayments: Payment[] = [];

      for (const pay of data.payments) {
        const payAmount = Number(pay.amount);
        if (payAmount <= 0) continue;

        // If Credit / Khata
        if (pay.paymentMethod === PaymentMethod.CREDIT) {
          if (!invoice.customer_id) {
            throw new BadRequestError('Cannot pay via credit without an assigned customer');
          }

          let account = await queryRunner.manager.findOne(CreditAccount, {
            where: { customer_id: invoice.customer_id, business_id: data.businessId },
          });

          if (!account) {
            account = queryRunner.manager.create(CreditAccount, {
              business_id: data.businessId,
              customer_id: invoice.customer_id,
              balance: 0,
            });
            await queryRunner.manager.save(account);
          }

          const newAccountBalance = Number(account.balance) + payAmount;
          account.balance = newAccountBalance;
          await queryRunner.manager.save(account);

          const creditTx = queryRunner.manager.create(CreditTransaction, {
            business_id: data.businessId,
            credit_account_id: account.id,
            invoice_id: invoice.id,
            type: CreditTransactionType.DEBIT,
            amount: payAmount,
            balance_after: newAccountBalance,
            notes: `Invoice ${invoice.invoice_number} charged to Khata`,
            created_by: data.userId,
          });
          await queryRunner.manager.save(creditTx);

          // Sync denormalized credit_balance on Customer
          await queryRunner.manager.update(Customer, { id: invoice.customer_id }, { credit_balance: newAccountBalance });
        }

        const paymentRecord = queryRunner.manager.create(Payment, {
          business_id: data.businessId,
          branch_id: data.branchId,
          invoice_id: invoice.id,
          payment_method: pay.paymentMethod,
          amount: payAmount,
          reference_number: pay.referenceNumber || null,
          notes: pay.notes || null,
          created_by: data.userId,
        });

        await queryRunner.manager.save(paymentRecord);
        createdPayments.push(paymentRecord);
      }

      // Update invoice amounts
      const newPaidAmount = Number(invoice.paid_amount) + totalPaidIncoming;
      const newDueAmount = Number(invoice.total_amount) - newPaidAmount;
      invoice.paid_amount = newPaidAmount;
      invoice.due_amount = newDueAmount;

      const isFullyPaid = newDueAmount <= 0;
      invoice.status = isFullyPaid ? InvoiceStatus.PAID : InvoiceStatus.PARTIAL;
      await queryRunner.manager.save(invoice);

      // If fully paid, complete order and handle loyalty + table release
      if (isFullyPaid && invoice.order) {
        invoice.order.status = OrderStatus.COMPLETED;
        await queryRunner.manager.save(invoice.order);

        // Free table
        if (invoice.order.table_id) {
          await queryRunner.manager.update(
            Table,
            { id: invoice.order.table_id },
            { status: TableStatus.CLEANING }
          );
        }

        // Award loyalty points if customer exists
        if (invoice.customer_id) {
          const rule = await queryRunner.manager.findOne(LoyaltyRule, {
            where: { business_id: data.businessId, is_active: true },
          });

          if (rule && rule.spend_amount > 0) {
            const pointsToAward = Math.floor(
              (Number(invoice.total_amount) / Number(rule.spend_amount)) * rule.points_earned
            );

            if (pointsToAward > 0) {
              const customer = await queryRunner.manager.findOne(Customer, {
                where: { id: invoice.customer_id },
              });

              if (customer) {
                const newPoints = customer.loyalty_points + pointsToAward;
                customer.loyalty_points = newPoints;
                await queryRunner.manager.save(customer);

                const loyaltyTx = queryRunner.manager.create(LoyaltyTransaction, {
                  business_id: data.businessId,
                  customer_id: customer.id,
                  order_id: invoice.order_id,
                  type: LoyaltyTransactionType.EARN,
                  points: pointsToAward,
                  balance_after: newPoints,
                  notes: `Earned from invoice ${invoice.invoice_number}`,
                  created_by: data.userId,
                });
                await queryRunner.manager.save(loyaltyTx);
              }
            }
          }
        }
      }

      await queryRunner.commitTransaction();

      return {
        invoice,
        payments: createdPayments,
        isFullyPaid,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async refundPayment(data: {
    businessId: string;
    userId: string;
    paymentId: string;
    amount: number;
    reason?: string;
  }) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const payment = await queryRunner.manager.findOne(Payment, {
        where: { id: data.paymentId, business_id: data.businessId },
        relations: ['invoice'],
      });

      if (!payment) throw new NotFoundError('Payment record not found');
      if (data.amount > Number(payment.amount)) {
        throw new BadRequestError('Refund amount cannot exceed original payment amount');
      }

      const refund = queryRunner.manager.create(Refund, {
        invoice_id: payment.invoice_id,
        payment_id: payment.id,
        amount: data.amount,
        reason: data.reason || null,
        created_by: data.userId,
      });
      await queryRunner.manager.save(refund);

      // Adjust invoice paid and due amounts
      const invoice = payment.invoice;
      invoice.paid_amount = Number(invoice.paid_amount) - data.amount;
      invoice.due_amount = Number(invoice.due_amount) + data.amount;
      invoice.status = InvoiceStatus.REFUNDED;
      await queryRunner.manager.save(invoice);

      await queryRunner.commitTransaction();
      return refund;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async listPayments(businessId: string, branchId?: string, invoiceId?: string) {
    const query = this.paymentRepo
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.invoice', 'invoice')
      .leftJoinAndSelect('payment.creator', 'creator')
      .where('payment.business_id = :businessId', { businessId });

    if (branchId) {
      query.andWhere('payment.branch_id = :branchId', { branchId });
    }
    if (invoiceId) {
      query.andWhere('payment.invoice_id = :invoiceId', { invoiceId });
    }

    return query.orderBy('payment.created_at', 'DESC').getMany();
  }
}
