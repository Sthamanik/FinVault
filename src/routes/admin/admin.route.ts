import { Router } from "express";
import AdminController from "@controllers/admin/admin.controller.js";
import { verifyJWT } from "@middlewares/auth.middleware.js";
import { authLimiter, authenticatedLimiter } from "@middlewares/rateLimit.middleware.js";
import asyncHandler from "@utils/asyncHandler.utils.js";
import {
  validateChangePassword,
  validateLogin,
  validateRefreshToken,
} from "@validations/auth.validation.js";

class AdminRoute {
  public router: Router;

  constructor() {
    this.router = Router();
    this.registerRoutes();
  }

  private registerRoutes() {
    // Public routes
    this.router.post(
      "/login",
      authLimiter,
      validateLogin,
      asyncHandler(AdminController.login.bind(AdminController))
    );

    // authenticated routes 
    this.router.post(
      "/logout",
      verifyJWT,
      authenticatedLimiter,
      asyncHandler(AdminController.logout.bind(AdminController))
    );

    this.router.get(
      "/me",
      verifyJWT,
      authenticatedLimiter,
      asyncHandler(AdminController.getCurrentUser.bind(AdminController))
    );

    this.router.patch(
      "/change-password",
      verifyJWT,
      authenticatedLimiter,
      validateChangePassword,
      asyncHandler(AdminController.changePassword.bind(AdminController))
    );
  }
}

export default new AdminRoute().router;
