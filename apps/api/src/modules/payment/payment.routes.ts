import { Router, Request, Response, NextFunction } from 'express';
import { PaymentService } from './payment.service';
import { authenticate } from '@middleware/authenticate';
import { authorize } from '@middleware/authorize';
import { requireTenant, requireBranch } from '@middleware/tenant';
import { PERMISSIONS } from '@shared/constants/permissions';
import { sendSuccess } from '@shared/utils/response.util';

const router = Router();
const service = new PaymentService();

router.use(authenticate);
router.use(requireTenant);

// Process single or split payment
router.post('/', requireBranch, authorize(PERMISSIONS.PAYMENT_PROCESS), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { invoiceId, payments } = req.body;
    const result = await service.processPayments({
      businessId: req.businessId!,
      branchId: req.branchId!,
      userId: req.user!.userId,
      invoiceId,
      payments,
    });
    sendSuccess(res, result, 'Payment recorded successfully', 201);
  } catch (err) {
    next(err);
  }
});

// Issue refund
router.post('/refund', authorize(PERMISSIONS.PAYMENT_REFUND), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { paymentId, amount, reason } = req.body;
    const refund = await service.refundPayment({
      businessId: req.businessId!,
      userId: req.user!.userId,
      paymentId,
      amount,
      reason,
    });
    sendSuccess(res, refund, 'Refund recorded successfully', 201);
  } catch (err) {
    next(err);
  }
});

// List payments
router.get('/', authorize(PERMISSIONS.PAYMENT_VIEW), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { invoiceId } = req.query;
    const payments = await service.listPayments(
      req.businessId!,
      req.branchId,
      invoiceId as string
    );
    sendSuccess(res, payments);
  } catch (err) {
    next(err);
  }
});

export const paymentRoutes = router;
