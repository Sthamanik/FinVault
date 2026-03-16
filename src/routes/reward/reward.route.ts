import { Router } from "express";
import RewardController from "@controllers/reward/reward.controller.js";
import { verifyJWT } from "@middlewares/auth.middleware.js";
import asyncHandler from "@utils/asyncHandler.utils.js";
import upload from "@config/multer.js";
import {
  validateCreateReward,
  validateUpdateReward,
} from "@validations/reward.validation.js";

class RewardRoute {
  public router: Router;

  constructor() {
    this.router = Router();
    this.registerRoutes();
  }

  private registerRoutes() {
    // Public
    this.router.get(
      "/",
      asyncHandler(RewardController.getAll.bind(RewardController))
    );
    this.router.get(
      "/:id",
      asyncHandler(RewardController.getById.bind(RewardController))
    );

    // Admin protected
    this.router.post(
      "/",
      verifyJWT,
      upload.single("image"),
      validateCreateReward,
      asyncHandler(RewardController.create.bind(RewardController))
    );

    this.router.patch(
      "/:id",
      verifyJWT,
      upload.single("image"),
      validateUpdateReward,
      asyncHandler(RewardController.update.bind(RewardController))
    );

    this.router.delete(
      "/:id",
      verifyJWT,
      asyncHandler(RewardController.delete.bind(RewardController))
    );
  }
}

export default new RewardRoute().router;
