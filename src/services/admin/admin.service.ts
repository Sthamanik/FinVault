import Admin from "@models/admin.model.js";
import { ApiError } from "@utils/apiError.utils.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "@utils/jwt.utils.js";
import { LoginData, RegisterData } from "interfaces/admin.interface.js";

class AdminService {
  // Register new admin
  async register(data: RegisterData) {
    const { email, password } = data;

    // Check if admin exists
    const existingadmin = await Admin.findOne({ email });
    if (existingadmin) {
      throw new ApiError(409, "admin with email already exists");
    }

    // Create admin
    const admin = await Admin.create({
      email,
      password,
    });

    // Generate tokens
    const accessToken = generateAccessToken(admin);
    const refreshToken = generateRefreshToken(admin);

    // Save refresh token
    admin.refreshToken = refreshToken;
    await admin.save({ validateBeforeSave: false });

    

    // Remove sensitive data
    const adminResponse = await Admin.findById(admin._id).select(
      "-password -refreshToken"
    );

    return {
      admin: adminResponse,
      accessToken,
      refreshToken,
    };
  }

  // Login admin
  async login(data: LoginData) {
    const { email, password } = data;

    // Find admin
    const admin = await Admin.findOne({ email });
    if (!admin) {
      throw new ApiError(404, "admin does not exist");
    }

    // Verify password
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid credentials");
    }

    // Generate tokens
    const accessToken = generateAccessToken(admin);
    const refreshToken = generateRefreshToken(admin);

    // Save refresh token
    admin.refreshToken = refreshToken;
    await admin.save({ validateBeforeSave: false });

    // Remove sensitive data
    const adminResponse = await Admin.findById(admin._id).select(
      "-password -refreshToken"
    );

    return {
      admin: adminResponse,
      accessToken,
      refreshToken,
    };
  }

  // Logout admin
  async logout(adminId: string){
    await Admin.findByIdAndUpdate(
      adminId,
      { $unset: { refreshToken: 1 } },
      { returnDocument: "after" }
    );

    return null;
  }

  // Get current admin
  async getCurrentUser(adminId: string) {
    const admin = await Admin.findById(adminId).select(
      "-password -refreshToken"
    );

    if (!admin) {
      throw new ApiError(404, "admin not found");
    }

    return admin;
  }

  // Change password
  async changePassword(
    adminId: string,
    currentPassword: string,
    newPassword: string
  ) {
    const admin = await Admin.findById(adminId);
    if (!admin) {
      throw new ApiError(404, "admin not found");
    }

    const isPasswordValid = await admin.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new ApiError(400, "Invalid old password");
    }

    admin.password = newPassword; // Will be hashed by pre-save hook
    await admin.save();

    return null;
  }
}

export default new AdminService();
