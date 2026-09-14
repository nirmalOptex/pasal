import { AppDataSource } from '@database/data-source';
import {
  Order,
  OrderItem,
  OrderStatusHistory,
  Kot,
  KotItem,
  Product,
  Table,
  Customer,
} from '@entities/index';
import { NotFoundError, BadRequestError } from '@shared/errors/app-error';
import { OrderType, OrderStatus, TableStatus, KotStatus, OrderItemStatus } from '@chhiyapasal/shared-types';

export class OrderService {
  private orderRepo = AppDataSource.getRepository(Order);
  private productRepo = AppDataSource.getRepository(Product);

  async createOrder(data: {
    businessId: string;
    branchId: string;
    userId: string;
    orderType: OrderType;
    customerId?: string | null;
    customerName?: string | null;
    tableId?: string | null;
    notes?: string | null;
    deliveryAddress?: string | null;
    items: Array<{
      productId: string;
      quantity: number;
      discountAmount?: number;
      notes?: string;
    }>;
  }) {
    if (!data.items || data.items.length === 0) {
      throw new BadRequestError('Order must contain at least one item');
    }

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Generate Order Number & Daily Token
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      const countToday = await queryRunner.manager
        .createQueryBuilder(Order, 'order')
        .where('order.branch_id = :branchId', { branchId: data.branchId })
        .andWhere('DATE(order.created_at) = CURRENT_DATE')
        .getCount();

      const sequence = countToday + 1;
      const orderNumber = `ORD-${dateStr}-${String(sequence).padStart(3, '0')}`;
      const tokenNumber = sequence % 100 === 0 ? 100 : sequence % 100;

      // 2. Fetch products and calculate server-side totals safely
      const productIds = data.items.map((i) => i.productId);
      const products = await this.productRepo
        .createQueryBuilder('product')
        .where('product.id IN (:...productIds)', { productIds })
        .andWhere('product.business_id = :businessId', { businessId: data.businessId })
        .getMany();

      const productMap = new Map(products.map((p) => [p.id, p]));

      let subtotal = 0;
      let totalTax = 0;
      let totalDiscount = 0;

      const orderItems: OrderItem[] = [];

      for (const itemInput of data.items) {
        const prod = productMap.get(itemInput.productId);
        if (!prod) {
          throw new BadRequestError(`Product ${itemInput.productId} not found or inactive`);
        }
        if (!prod.is_available) {
          throw new BadRequestError(`Product "${prod.name}" is currently unavailable`);
        }

        const unitPrice = Number(prod.price);
        const qty = itemInput.quantity;
        const discount = Number(itemInput.discountAmount || 0);
        const taxableAmount = Math.max(0, unitPrice * qty - discount);
        const taxRate = Number(prod.tax_rate || 0);
        const tax = (taxableAmount * taxRate) / 100;
        const totalLinePrice = taxableAmount + tax;

        subtotal += unitPrice * qty;
        totalDiscount += discount;
        totalTax += tax;

        const orderItem = queryRunner.manager.create(OrderItem, {
          product_id: prod.id,
          product_name: prod.name,
          product_price: unitPrice,
          quantity: qty,
          unit_price: unitPrice,
          discount_amount: discount,
          tax_amount: tax,
          total_price: totalLinePrice,
          notes: itemInput.notes || null,
          status: OrderItemStatus.PENDING,
        });

        orderItems.push(orderItem);
      }

      const totalAmount = subtotal - totalDiscount + totalTax;

      // 3. Create Order
      const order = queryRunner.manager.create(Order, {
        business_id: data.businessId,
        branch_id: data.branchId,
        order_number: orderNumber,
        order_type: data.orderType,
        status: OrderStatus.PENDING,
        customer_id: data.customerId || null,
        customer_name: data.customerName || null,
        table_id: data.tableId || null,
        token_number: tokenNumber,
        delivery_address: data.deliveryAddress || null,
        subtotal,
        discount_amount: totalDiscount,
        tax_amount: totalTax,
        total_amount: totalAmount,
        notes: data.notes || null,
        created_by: data.userId,
      });

      await queryRunner.manager.save(order);

      // Attach items to order
      for (const item of orderItems) {
        item.order_id = order.id;
      }
      await queryRunner.manager.save(orderItems);

      // 4. Mark table as OCCUPIED if table-based order
      if (data.tableId) {
        await queryRunner.manager.update(Table, { id: data.tableId }, { status: TableStatus.OCCUPIED });
      }

      // 5. Order Status History
      const history = queryRunner.manager.create(OrderStatusHistory, {
        order_id: order.id,
        from_status: null,
        to_status: OrderStatus.PENDING,
        changed_by: data.userId,
        notes: 'Order initiated',
      });
      await queryRunner.manager.save(history);

      await queryRunner.commitTransaction();

      return this.getOrderById(order.id, data.businessId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async confirmOrder(orderId: string, businessId: string, userId: string) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, business_id: businessId },
      relations: ['items'],
    });
    if (!order) throw new NotFoundError('Order not found');
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestError(`Cannot confirm an order that is in status ${order.status}`);
    }

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Update order status
      const prevStatus = order.status;
      order.status = OrderStatus.CONFIRMED;
      order.updated_by = userId;
      await queryRunner.manager.save(order);

      // 2. Record Status History
      const history = queryRunner.manager.create(OrderStatusHistory, {
        order_id: order.id,
        from_status: prevStatus,
        to_status: OrderStatus.CONFIRMED,
        changed_by: userId,
        notes: 'Order confirmed and sent to kitchen',
      });
      await queryRunner.manager.save(history);

      // 3. Auto-generate Kitchen Order Ticket (KOT)
      const kotCount = await queryRunner.manager
        .createQueryBuilder(Kot, 'kot')
        .where('kot.branch_id = :branchId', { branchId: order.branch_id })
        .andWhere('DATE(kot.created_at) = CURRENT_DATE')
        .getCount();

      const kotNumber = `KOT-${String(kotCount + 1).padStart(3, '0')}`;
      const kot = queryRunner.manager.create(Kot, {
        branch_id: order.branch_id,
        order_id: order.id,
        kot_number: kotNumber,
        status: KotStatus.NEW,
        created_by: userId,
      });
      await queryRunner.manager.save(kot);

      const kotItems = order.items.map((oi) =>
        queryRunner.manager.create(KotItem, {
          kot_id: kot.id,
          order_item_id: oi.id,
          product_name: oi.product_name,
          quantity: oi.quantity,
          notes: oi.notes,
          status: KotStatus.NEW,
        })
      );
      await queryRunner.manager.save(kotItems);

      await queryRunner.commitTransaction();
      return this.getOrderById(order.id, businessId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateOrderStatus(orderId: string, newStatus: OrderStatus, businessId: string, userId: string, notes?: string) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, business_id: businessId },
    });
    if (!order) throw new NotFoundError('Order not found');

    const prevStatus = order.status;
    order.status = newStatus;
    order.updated_by = userId;
    await this.orderRepo.save(order);

    // If order is completed or cancelled, free the table
    if ((newStatus === OrderStatus.COMPLETED || newStatus === OrderStatus.CANCELLED) && order.table_id) {
      await AppDataSource.getRepository(Table).update({ id: order.table_id }, { status: TableStatus.CLEANING });
    }

    const historyRepo = AppDataSource.getRepository(OrderStatusHistory);
    const history = historyRepo.create({
      order_id: order.id,
      from_status: prevStatus,
      to_status: newStatus,
      changed_by: userId,
      notes: notes || `Status updated to ${newStatus}`,
    });
    await historyRepo.save(history);

    return this.getOrderById(order.id, businessId);
  }

  async getOrderById(orderId: string, businessId: string) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, business_id: businessId },
      relations: [
        'items',
        'table',
        'table.area',
        'customer',
        'creator',
        'status_history',
        'status_history.user',
        'kots',
        'kots.items',
        'invoice',
        'invoice.payments',
      ],
    });
    if (!order) throw new NotFoundError('Order not found');
    return order;
  }

  async listOrders(params: {
    businessId: string;
    branchId?: string;
    status?: OrderStatus;
    orderType?: OrderType;
    date?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const query = this.orderRepo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('order.table', 'table')
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('order.invoice', 'invoice')
      .where('order.business_id = :businessId', { businessId: params.businessId });

    if (params.branchId) {
      query.andWhere('order.branch_id = :branchId', { branchId: params.branchId });
    }
    if (params.status) {
      query.andWhere('order.status = :status', { status: params.status });
    }
    if (params.orderType) {
      query.andWhere('order.order_type = :orderType', { orderType: params.orderType });
    }
    if (params.date) {
      query.andWhere('DATE(order.created_at) = :date', { date: params.date });
    }

    query.orderBy('order.created_at', 'DESC').skip(skip).take(limit);

    const [orders, total] = await query.getManyAndCount();

    return {
      orders,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
