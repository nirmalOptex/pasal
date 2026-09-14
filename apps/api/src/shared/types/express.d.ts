import { JwtUserPayload } from '@chhiyapasal/shared-types';

declare global {
  namespace Express {
    interface Request {
      user?: JwtUserPayload;
      businessId?: string;
      branchId?: string;
    }
  }
}
