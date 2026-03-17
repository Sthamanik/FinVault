import { Router } from "express";
import ContactController from "@controllers/contact/contact.controller.js";
import { verifyJWT } from "@middlewares/auth.middleware.js";
import { authenticatedLimiter, publicWriteLimiter } from "@middlewares/rateLimit.middleware.js";
import asyncHandler from "@utils/asyncHandler.utils.js";
import {
  validateCreateContact,
  validateUpdateContactStatus,
} from "@validations/contact.validation.js";

class ContactRoute {
  public router: Router;

  constructor() {
    this.router = Router();
    this.registerRoutes();
  }

  private registerRoutes() {
    // Public
    this.router.post(
      "/",
      publicWriteLimiter,
      validateCreateContact,
      asyncHandler(ContactController.create.bind(ContactController))
    );

    // Admin protected
    this.router.get(
      "/",
      verifyJWT,
      authenticatedLimiter,
      asyncHandler(ContactController.getAll.bind(ContactController))
    );

    this.router.get(
      "/:id",
      verifyJWT,
      authenticatedLimiter,
      asyncHandler(ContactController.getById.bind(ContactController))
    );

    this.router.patch(
      "/:id/status",
      verifyJWT,
      authenticatedLimiter,
      validateUpdateContactStatus,
      asyncHandler(ContactController.updateStatus.bind(ContactController))
    );

    this.router.delete(
      "/:id",
      verifyJWT,
      authenticatedLimiter,
      asyncHandler(ContactController.delete.bind(ContactController))
    );
  }
}

export default new ContactRoute().router;
