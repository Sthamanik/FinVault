import { Router } from 'express';
import DashboardController from '@controllers/admin/dashboard.controller.js';
import { verifyJWT } from '@middlewares/auth.middleware.js';
import { authenticatedLimiter } from '@middlewares/rateLimit.middleware.js';
import asyncHandler from '@utils/asyncHandler.utils.js';

class DashboardRoute {
  public router: Router;

  constructor() {
    this.router = Router();
    this.registerRoutes();
  }

  private registerRoutes() {
    this.router.get(
      '/',
      verifyJWT,
      authenticatedLimiter,
      asyncHandler(DashboardController.getSummary.bind(DashboardController))
    );
  }
}

export default new DashboardRoute().router;