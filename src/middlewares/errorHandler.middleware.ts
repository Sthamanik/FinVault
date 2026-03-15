import { ApiError } from "@utils/apiError.utils.js";
import { NextFunction, Request, Response } from "express";

const errorHandler = (
    err: any,
    _: Request,
    res: Response,
    _next: NextFunction
) => {
    if ( err instanceof ApiError) {
        return res.status(err.statusCode).json({
            statusCode: err.statusCode,
            success: err.success,
            message: err.message || "Something went wrong",
            errors: err.errors || [],
        });
    }

    // Unknown/unhandled errors
    const error = err as any;
    return res.status(error?.statusCode || 500).json({
        statusCode: error?.statusCode || 500,
        success: false,
        message: error?.message || 'Internal server error',
        errors: [],
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
    });
};

export default errorHandler;