import { Router } from "express";
import CareerController from "@controllers/career/career.controller.js";
import { verifyJWT } from "@middlewares/auth.middleware.js";
import { authenticatedLimiter } from "@middlewares/rateLimit.middleware.js";
import asyncHandler from "@utils/asyncHandler.utils.js";
import {
  ValidateCreateCareer,
  ValidateUpdateCareer,
} from "@validations/career.validation.js";

class CareerRoute {
  public router: Router;

  constructor() {
    this.router = Router();
    this.registerRoutes();
  }

  private registerRoutes() {
    // Public
    this.router.get(
      "/",
      asyncHandler(CareerController.getAll.bind(CareerController))
    );


    this.router.get(
      "/slug/:slug",
      asyncHandler(CareerController.getBySlug.bind(CareerController))
    );

    // Admin protected
    this.router.get(
      "/:id",
      verifyJWT,
      authenticatedLimiter,
      asyncHandler(CareerController.getById.bind(CareerController))
    );

    this.router.post(
      "/",
      verifyJWT,
      authenticatedLimiter,
      ValidateCreateCareer,
      asyncHandler(CareerController.create.bind(CareerController))
    );

    this.router.patch(
      "/:id",
      verifyJWT,
      authenticatedLimiter,
      ValidateUpdateCareer,
      asyncHandler(CareerController.update.bind(CareerController))
    );

    this.router.patch(
      "/:id/delete",
      verifyJWT,
      authenticatedLimiter,
      asyncHandler(CareerController.delete.bind(CareerController))
    );

    this.router.patch(
      "/:id/restore",
      verifyJWT,
      authenticatedLimiter,
      asyncHandler(CareerController.restore.bind(CareerController))
    );

    this.router.delete(
      "/:id/hard-delete",
      verifyJWT,
      authenticatedLimiter,
      asyncHandler(CareerController.hardDelete.bind(CareerController))
    );

    this.router.patch(
      "/:id/toggle-active",
      verifyJWT,
      authenticatedLimiter,
      asyncHandler(CareerController.toggleActive.bind(CareerController))
    );
  }
}

export default new CareerRoute().router;
