import { Request, Response, NextFunction } from 'express';
import { OrderService } from './order.service';
import { sendSuccess } from '@shared/utils/response.util';
import { OrderStatus } from '@chhiyapasal/shared-types';

export class OrderController {
  private orderService = new OrderService();

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const order = await this.orderService.createOrder({
        businessId: req.businessId!,
        branchId: req.branchId!,
        userId: req.user!.userId,
        orderType: req.body.orderType,
        customerId: req.body.customerId,
        customerName: req.body.customerName,
        tableId: req.body.tableId,
        notes: req.body.notes,
        deliveryAddress: req.body.deliveryAddress,
        items: req.body.items,
      });
      sendSuccess(res, order, 'Order created successfully', 201);
    } catch (err) {
      next(err);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status, orderType, date, page, limit } = req.query;
      const result = await this.orderService.listOrders({
        businessId: req.businessId!,
        branchId: req.branchId,
        status: status as OrderStatus,
        orderType: orderType as any,
        date: date as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });
      sendSuccess(res, result.orders, 'Orders retrieved', 200, result.meta);
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const order = await this.orderService.getOrderById(req.params.id, req.businessId!);
      sendSuccess(res, order);
    } catch (err) {
      next(err);
    }
  };

  confirm = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const order = await this.orderService.confirmOrder(req.params.id, req.businessId!, req.user!.userId);
      sendSuccess(res, order, 'Order confirmed and KOT sent to kitchen');
    } catch (err) {
      next(err);
    }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status, notes } = req.body;
      const order = await this.orderService.updateOrderStatus(
        req.params.id,
        status,
        req.businessId!,
        req.user!.userId,
        notes
      );
      sendSuccess(res, order, `Order status updated to ${status}`);
    } catch (err) {
      next(err);
    }
  };

  cancel = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { reason } = req.body;
      const order = await this.orderService.updateOrderStatus(
        req.params.id,
        OrderStatus.CANCELLED,
        req.businessId!,
        req.user!.userId,
        reason || 'Order cancelled'
      );
      sendSuccess(res, order, 'Order cancelled successfully');
    } catch (err) {
      next(err);
    }
  };
}
