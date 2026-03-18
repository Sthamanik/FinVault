import { ApiError } from "@utils/apiError.utils.js";
import { NextFunction, Request, Response } from "express";
import logger from "@utils/logger.utils.js";

const errorHandler = (
  err: any,
  _: Request,
  res: Response,
  _next: NextFunction
) => {
  // Known operational errors
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      statusCode: err.statusCode,
      success: false,
      message: err.message || "Something went wrong",
      errors: err.errors || [],
    });
  }

  // MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {}).join(", ");
    return res.status(409).json({
      statusCode: 409,
      success: false,
      message: `Duplicate value on: ${field}`,
      errors: [],
    });
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e: any) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: `Invalid value for field: ${err.path}`,
      errors: [],
    });
  }

  // JWT errors (fallback — auth middleware handles most of these)
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      statusCode: 401,
      success: false,
      message: "Invalid token",
      errors: [],
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      statusCode: 401,
      success: false,
      message: "Token expired",
      errors: [],
    });
  }

  // Unknown/unhandled errors
  logger.error(err);
  return res.status(500).json({
    statusCode: 500,
    success: false,
    message: "Internal server error",
    errors: [],
    stack: process.env.NODE_ENV === "development" ? err?.stack : undefined,
  });
};

export default errorHandler;