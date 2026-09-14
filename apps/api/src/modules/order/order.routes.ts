import { Router } from 'express';
import { OrderController } from './order.controller';
import { authenticate } from '@middleware/authenticate';
import { authorize } from '@middleware/authorize';
import { requireTenant, requireBranch } from '@middleware/tenant';
import { PERMISSIONS } from '@shared/constants/permissions';

const router = Router();
const controller = new OrderController();

router.use(authenticate);
router.use(requireTenant);

router.get('/', controller.list);
router.post('/', requireBranch, authorize(PERMISSIONS.ORDER_CREATE), controller.create);
router.get('/:id', controller.getById);
router.post('/:id/confirm', authorize(PERMISSIONS.ORDER_EDIT), controller.confirm);
router.patch('/:id/status', authorize(PERMISSIONS.ORDER_STATUS_UPDATE), controller.updateStatus);
router.post('/:id/cancel', authorize(PERMISSIONS.ORDER_CANCEL), controller.cancel);

export const orderRoutes = router;
