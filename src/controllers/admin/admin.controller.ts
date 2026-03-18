import { Request, Response } from "express";
import { ApiResponse } from "@utils/apiResponse.utils.js";
import { ApiError } from "@utils/apiError.utils.js";
import AdminService from "@services/admin/admin.service.js";

class AdminController {
    private cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    }
  // Register admin
  async register(req: Request, res: Response) {
    const data = await AdminService.register(req.body);
    const {admin, accessToken, refreshToken} = data;

    res
      .status(201)
      .cookie("accessToken", accessToken, {
        ...this.cookieOptions,
        maxAge: 15 * 60 * 1000,
      }) // 15 min
      .cookie("refreshToken", refreshToken, this.cookieOptions)
      .json(new ApiResponse(201, admin, "Admin registered successfully"));
  }

  // Login admin
  async login(req: Request, res: Response) {
    const data = await AdminService.login(req.body);
    const {admin, accessToken, refreshToken} = data;

    res
      .status(200)
      .cookie("accessToken", accessToken, {
        ...this.cookieOptions,
        maxAge: 15 * 60 * 1000,
      }) // 15 min
      .cookie("refreshToken", refreshToken, this.cookieOptions)
      .json(new ApiResponse(200, admin, "Admin logged in successfully"));
  }

  // Logout admin
  async logout(req: Request, res: Response) {
    const adminId = req.user?._id;
    if (!adminId) {
      throw new ApiError(401, "Unauthorized request");
    }

    await AdminService.logout(adminId.toString());

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
    };

    res
      .status(200)
      .clearCookie("accessToken", cookieOptions)
      .clearCookie("refreshToken", cookieOptions)
      .json(new ApiResponse(200, null, "Admin logged out successfully"));
  }

  // Get current admin
  async getCurrentUser(req: Request, res: Response) {
    const adminId = req.user?._id;
    if (!adminId) {
      throw new ApiError(401, "Unauthorized request");
    }

    const admin = await AdminService.getCurrentUser(adminId.toString());

    res
      .status(200)
      .json(new ApiResponse(200, admin, "Current admin fetched successfully"));
  }

  // Change password
  async changePassword(req: Request, res: Response) {
    const adminId = req.user?._id;
    if (!adminId) {
      throw new ApiError(401, "Unauthorized request");
    }

    const { currentPassword, newPassword } = req.body;

    await AdminService.changePassword(
      adminId.toString(),
      currentPassword,
      newPassword
    );

    res
      .status(200)
      .json(new ApiResponse(200, null, "Password changed successfully"));
  }
}

export default new AdminController();
