import { Router } from "express";
import AdminController from "@controllers/admin.controller.js";
import { verifyJWT } from "@middlewares/auth.middleware.js";
import asyncHandler from "@utils/asyncHandler.utils.js";
import {
  validateChangePassword,
  validateLogin,
  validateRefreshToken,
  validateRegisterAdmin,
} from "@validations/auth.validation.js";

class AdminRoute {
  public router: Router;

  constructor() {
    this.router = Router();
    this.registerRoutes();
  }

  private registerRoutes() {
    this.router.post(
      "/register",
      validateRegisterAdmin,
      asyncHandler(AdminController.register.bind(AdminController))
    );

    this.router.post(
      "/login",
      validateLogin,
      asyncHandler(AdminController.login.bind(AdminController))
    );

    this.router.post(
      "/logout",
      verifyJWT,
      asyncHandler(AdminController.logout.bind(AdminController))
    );

    this.router.post(
      "/refresh-token",
      validateRefreshToken,
      asyncHandler(AdminController.refreshAccessToken.bind(AdminController))
    );

    this.router.get(
      "/me",
      verifyJWT,
      asyncHandler(AdminController.getCurrentUser.bind(AdminController))
    );

    this.router.patch(
      "/change-password",
      verifyJWT,
      validateChangePassword,
      asyncHandler(AdminController.changePassword.bind(AdminController))
    );
  }
}

export default new AdminRoute().router;
