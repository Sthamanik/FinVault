import { Router } from 'express';
import ServiceController from '@controllers/services/services.controller.js';
import { verifyJWT } from '@middlewares/auth.middleware.js';
import { authenticatedLimiter } from '@middlewares/rateLimit.middleware.js';
import asyncHandler from '@utils/asyncHandler.utils.js';
import upload from '@config/multer.js';
import {
  validateCreateService,
  validateUpdateService,
} from '@validations/service.validation.js';

class ServiceRoute {
  public router: Router;

  constructor() {
    this.router = Router();
    this.registerRoutes();
  }

  private registerRoutes() {
    // Public
    this.router.get(
      '/',
      asyncHandler(ServiceController.getAll.bind(ServiceController))
    );

    this.router.get(
      '/slug/:slug',
      asyncHandler(ServiceController.getBySlug.bind(ServiceController))
    );

    // Admin protected
    this.router.get(
      '/:id',
      verifyJWT,
      authenticatedLimiter,
      asyncHandler(ServiceController.getById.bind(ServiceController))
    );

    this.router.post(
      '/',
      verifyJWT,
      authenticatedLimiter,
      upload.single('image'),
      validateCreateService,
      asyncHandler(ServiceController.create.bind(ServiceController))
    );

    this.router.patch(
      '/:id',
      verifyJWT,
      authenticatedLimiter,
      upload.single('image'),
      validateUpdateService,
      asyncHandler(ServiceController.update.bind(ServiceController))
    );

    this.router.patch(
      '/:id/delete',
      verifyJWT,
      authenticatedLimiter,
      asyncHandler(ServiceController.delete.bind(ServiceController))
    );

    this.router.patch(
      '/:id/restore',
      verifyJWT,
      authenticatedLimiter,
      asyncHandler(ServiceController.restore.bind(ServiceController))
    );

    this.router.delete(
      '/:id/hard-delete',
      verifyJWT,
      authenticatedLimiter,
      asyncHandler(ServiceController.hardDelete.bind(ServiceController))
    );

    this.router.patch(
      '/:id/toggle-active',
      verifyJWT,
      authenticatedLimiter,
      asyncHandler(ServiceController.toggleActive.bind(ServiceController))
    );
  }
}

export default new ServiceRoute().router;
