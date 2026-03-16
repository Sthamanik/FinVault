import { Router } from "express";
import CareerController from "@controllers/career/career.controller.js";
import { verifyJWT } from "@middlewares/auth.middleware.js";
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
      "/:id",
      asyncHandler(CareerController.getById.bind(CareerController))
    );

    // Admin protected
    this.router.post(
      "/",
      verifyJWT,
      ValidateCreateCareer,
      asyncHandler(CareerController.create.bind(CareerController))
    );

    this.router.patch(
      "/:id",
      verifyJWT,
      ValidateUpdateCareer,
      asyncHandler(CareerController.update.bind(CareerController))
    );

    this.router.delete(
      "/:id",
      verifyJWT,
      asyncHandler(CareerController.delete.bind(CareerController))
    );

    this.router.patch(
      "/:id/toggle-active",
      verifyJWT,
      asyncHandler(CareerController.toggleActive.bind(CareerController))
    );
  }
}

export default new CareerRoute().router;
