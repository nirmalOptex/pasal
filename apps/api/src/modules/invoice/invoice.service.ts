import { AppDataSource } from '@database/data-source';
import { Invoice, Order, Customer } from '@entities/index';
import { NotFoundError, BadRequestError } from '@shared/errors/app-error';
import { InvoiceStatus, OrderStatus } from '@chhiyapasal/shared-types';

export class InvoiceService {
  private invoiceRepo = AppDataSource.getRepository(Invoice);
  private orderRepo = AppDataSource.getRepository(Order);

  async generateInvoice(orderId: string, businessId: string, branchId: string, userId: string) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, business_id: businessId },
      relations: ['items', 'invoice'],
    });

    if (!order) throw new NotFoundError('Order not found');
    if (order.invoice) {
      return this.getInvoiceById(order.invoice.id, businessId);
    }

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      const count = await queryRunner.manager
        .createQueryBuilder(Invoice, 'inv')
        .where('inv.branch_id = :branchId', { branchId })
        .andWhere('DATE(inv.created_at) = CURRENT_DATE')
        .getCount();

      const invoiceNumber = `INV-${dateStr}-${String(count + 1).padStart(3, '0')}`;

      // Calculate totals strictly from order and its items
      const subtotal = Number(order.subtotal);
      const discount = Number(order.discount_amount || 0);
      const tax = Number(order.tax_amount || 0);
      const totalAmount = Number(order.total_amount);

      const invoice = queryRunner.manager.create(Invoice, {
        business_id: businessId,
        branch_id: branchId,
        order_id: order.id,
        invoice_number: invoiceNumber,
        customer_id: order.customer_id,
        subtotal,
        discount_amount: discount,
        tax_amount: tax,
        total_amount: totalAmount,
        paid_amount: 0,
        due_amount: totalAmount,
        status: InvoiceStatus.ISSUED,
        created_by: userId,
      });

      await queryRunner.manager.save(invoice);
      await queryRunner.commitTransaction();

      return this.getInvoiceById(invoice.id, businessId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getInvoiceById(invoiceId: string, businessId: string) {
    const invoice = await this.invoiceRepo.findOne({
      where: { id: invoiceId, business_id: businessId },
      relations: [
        'order',
        'order.items',
        'order.table',
        'order.table.area',
        'customer',
        'payments',
        'refunds',
        'creator',
      ],
    });
    if (!invoice) throw new NotFoundError('Invoice not found');
    return invoice;
  }

  async listInvoices(params: {
    businessId: string;
    branchId?: string;
    status?: InvoiceStatus;
    date?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const query = this.invoiceRepo
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.order', 'order')
      .leftJoinAndSelect('invoice.customer', 'customer')
      .leftJoinAndSelect('invoice.payments', 'payments')
      .where('invoice.business_id = :businessId', { businessId: params.businessId });

    if (params.branchId) {
      query.andWhere('invoice.branch_id = :branchId', { branchId: params.branchId });
    }
    if (params.status) {
      query.andWhere('invoice.status = :status', { status: params.status });
    }
    if (params.date) {
      query.andWhere('DATE(invoice.created_at) = :date', { date: params.date });
    }

    query.orderBy('invoice.created_at', 'DESC').skip(skip).take(limit);

    const [invoices, total] = await query.getManyAndCount();

    return {
      invoices,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async cancelInvoice(invoiceId: string, businessId: string, userId: string, reason: string) {
    const invoice = await this.invoiceRepo.findOne({
      where: { id: invoiceId, business_id: businessId },
      relations: ['payments'],
    });
    if (!invoice) throw new NotFoundError('Invoice not found');

    if (invoice.payments && invoice.payments.length > 0) {
      throw new BadRequestError('Cannot cancel an invoice with existing payments. Process a refund instead.');
    }

    invoice.status = InvoiceStatus.CANCELLED;
    invoice.cancelled_at = new Date();
    invoice.cancelled_by = userId;
    invoice.cancel_reason = reason;

    await this.invoiceRepo.save(invoice);
    return invoice;
  }
}
