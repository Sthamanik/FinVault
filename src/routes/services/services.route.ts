import { Router } from 'express';
import ServiceController from '@controllers/services/services.controller.js';
import { verifyJWT } from '@middlewares/auth.middleware.js';
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
      '/:id',
      asyncHandler(ServiceController.getById.bind(ServiceController))
    );

    // Admin protected
    this.router.post(
      '/',
      verifyJWT,
      upload.single('image'),
      validateCreateService,
      asyncHandler(ServiceController.create.bind(ServiceController))
    );

    this.router.patch(
      '/:id',
      verifyJWT,
      upload.single('image'),
      validateUpdateService,
      asyncHandler(ServiceController.update.bind(ServiceController))
    );

    this.router.delete(
      '/:id',
      verifyJWT,
      asyncHandler(ServiceController.delete.bind(ServiceController))
    );

    this.router.patch(
      '/:id/toggle-active',
      verifyJWT,
      asyncHandler(ServiceController.toggleActive.bind(ServiceController))
    );
  }
}

export default new ServiceRoute().router;