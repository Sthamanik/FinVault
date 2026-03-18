import fs from "fs";
import { Request, Response, NextFunction } from 'express';
import logger from "@utils/logger.utils.js";

const cleanupTmpOnError = (
  err: Error,
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  // Single file upload (req.file)
  if (req.file?.path && fs.existsSync(req.file.path)) {
    try {
      fs.unlinkSync(req.file.path);
      logger.warn(`[cleanupTmp] Cleaned orphaned file: ${req.file.path}`);
    } catch (e) {
      logger.error(`[cleanupTmp] Failed to clean ${req.file.path}: ${e}`);
    }
  }

  // Multi file upload (req.files)
  if (req.files) {
    const files = Array.isArray(req.files)
      ? req.files
      : Object.values(req.files).flat();

    for (const file of files) {
      if (file.path && fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path);
          logger.warn(`[cleanupTmp] Cleaned orphaned file: ${file.path}`);
        } catch (e) {
          logger.error(`[cleanupTmp] Failed to clean ${file.path}: ${e}`);
        }
      }
    }
  }

  next(err); // pass error along to errorHandler
};

export default cleanupTmpOnError;