import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import r2Client from "@config/r2.config.js";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import logger from "@utils/logger.utils.js";

const BUCKET = process.env.R2_BUCKET!;
const PUBLIC_URL = process.env.R2_PUBLIC_BASE_URL!;

const getMimeType = (ext: string): string => {
  const map: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".pdf": "application/pdf",
  };
  return map[ext.toLowerCase()] ?? "application/octet-stream";
};

// Safe cleanup helper — never throws
const cleanupTmpFile = (filePath: string) => {
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (err) {
    logger.error(`[r2] Failed to clean up tmp file ${filePath}: ${err}`);
  }
};

export const uploadToR2 = async (localFilePath: string) => {
  try {
    if (!localFilePath) return null;

    if (process.env.NODE_ENV === "test") {
      cleanupTmpFile(localFilePath);
      return {
        secure_url: `https://r2.test/${path.basename(localFilePath)}`,
        public_id: `test_${Date.now()}`,
      };
    }

    if (!fs.existsSync(localFilePath)) {
      logger.warn(`[r2] File not found at path: ${localFilePath}`);
      return null;
    }

    const fileBuffer = fs.readFileSync(localFilePath);
    const ext = path.extname(localFilePath);
    const key = `investment_app/${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;

    await r2Client.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: fileBuffer,
        ContentType: getMimeType(ext),
      })
    );

    cleanupTmpFile(localFilePath);

    return {
      secure_url: `${PUBLIC_URL}/${key}`,
      public_id: key,
    };
  } catch (error) {
    logger.error(`[r2] Upload failed for ${localFilePath}: ${error}`);
    cleanupTmpFile(localFilePath);
    return null;
  }
};

export const deleteFromR2 = async (publicId: string) => {
  try {
    if (process.env.NODE_ENV === "test") {
      return { result: "ok" };
    }

    await r2Client.send(
      new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: publicId,
      })
    );

    return { result: "ok" };
  } catch (error) {
    logger.error(`[r2] Failed to delete file ${publicId}: ${error}`);
    return null;
  }
};