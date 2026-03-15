import cloudinary from "@config/cloudinary.config.js";
import fs from "fs";

// Upload file to Cloudinary
export const uploadOnCloudinary = async (localFilePath: string) => {
  try {
    if (!localFilePath) return null;

    // Upload file to cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder: "investment_app",
    });

    // Remove local file after upload
    fs.unlinkSync(localFilePath);

    return response;
  } catch (error) {
    // Remove local file if upload fails
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    return null;
  }
};

// Delete file from Cloudinary
export const deleteFromCloudinary = async (publicId: string) => {
  try {
    const response = await cloudinary.uploader.destroy(publicId);
    return response;
  } catch (error) {
    return null;
  }
};

export default cloudinary;