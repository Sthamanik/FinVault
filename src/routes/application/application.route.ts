import { Router } from "express";
import ApplicationController from "@controllers/application/application.controller.js";
import { verifyJWT } from "@middlewares/auth.middleware.js";
import { authenticatedLimiter, publicWriteLimiter } from "@middlewares/rateLimit.middleware.js";
import asyncHandler from "@utils/asyncHandler.utils.js";
import {
  validateCreateApplication,
  validateUpdateApplicationStatus,
} from "@validations/application.validation.js";
import uploadPdf from "@config/multerPdf";

class ApplicationRoute {
  public router: Router;

  constructor() {
    this.router = Router();
    this.registerRoutes();
  }

  private registerRoutes() {
    // Public apply
    this.router.post(
      "/:jobId",
      publicWriteLimiter,
      uploadPdf.fields([
        { name: "resume", maxCount: 1 },
        { name: "coverLetterFile", maxCount: 1 },
      ]),
      validateCreateApplication,
      asyncHandler(ApplicationController.create.bind(ApplicationController))
    );

    // Admin protected
    this.router.get(
      "/",
      verifyJWT,
      authenticatedLimiter,
      asyncHandler(ApplicationController.getAll.bind(ApplicationController))
    );

    this.router.get(
      "/:id",
      verifyJWT,
      authenticatedLimiter,
      asyncHandler(ApplicationController.getById.bind(ApplicationController))
    );

    this.router.patch(
      "/:id/status",
      verifyJWT,
      authenticatedLimiter,
      validateUpdateApplicationStatus,
      asyncHandler(ApplicationController.updateStatus.bind(ApplicationController))
    );

    this.router.delete(
      "/:id",
      verifyJWT,
      authenticatedLimiter,
      asyncHandler(ApplicationController.delete.bind(ApplicationController))
    );
  }
}

export default new ApplicationRoute().router;
