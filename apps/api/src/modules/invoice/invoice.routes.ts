import { Router, Request, Response, NextFunction } from 'express';
import { InvoiceService } from './invoice.service';
import { authenticate } from '@middleware/authenticate';
import { authorize } from '@middleware/authorize';
import { requireTenant, requireBranch } from '@middleware/tenant';
import { PERMISSIONS } from '@shared/constants/permissions';
import { sendSuccess } from '@shared/utils/response.util';
import { InvoiceStatus } from '@chhiyapasal/shared-types';

const router = Router();
const service = new InvoiceService();

router.use(authenticate);
router.use(requireTenant);

// List invoices
router.get('/', authorize(PERMISSIONS.BILLING_VIEW), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, date, page, limit } = req.query;
    const result = await service.listInvoices({
      businessId: req.businessId!,
      branchId: req.branchId,
      status: status as InvoiceStatus,
      date: date as string,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });
    sendSuccess(res, result.invoices, 'Invoices retrieved', 200, result.meta);
  } catch (err) {
    next(err);
  }
});

// Generate invoice from order
router.post('/generate/:orderId', requireBranch, authorize(PERMISSIONS.BILLING_CREATE), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoice = await service.generateInvoice(
      req.params.orderId,
      req.businessId!,
      req.branchId!,
      req.user!.userId
    );
    sendSuccess(res, invoice, 'Invoice generated successfully', 201);
  } catch (err) {
    next(err);
  }
});

// Get invoice by ID
router.get('/:id', authorize(PERMISSIONS.BILLING_VIEW), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoice = await service.getInvoiceById(req.params.id, req.businessId!);
    sendSuccess(res, invoice);
  } catch (err) {
    next(err);
  }
});

// Cancel invoice
router.post('/:id/cancel', authorize(PERMISSIONS.BILLING_CANCEL), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reason } = req.body;
    const invoice = await service.cancelInvoice(req.params.id, req.businessId!, req.user!.userId, reason);
    sendSuccess(res, invoice, 'Invoice cancelled successfully');
  } catch (err) {
    next(err);
  }
});

export const invoiceRoutes = router;
