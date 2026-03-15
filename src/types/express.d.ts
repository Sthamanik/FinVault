import { IAdmin } from '@models/admin.model.js';

declare global {
  namespace Express {
    interface Request {
      user?: IAdmin;
    }
  }
}