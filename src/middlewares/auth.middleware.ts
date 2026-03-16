import { Request, Response, NextFunction } from 'express';
import Admin from '@models/admin.model.js';
import {ApiError} from '@utils/apiError.utils.js';
import { verifyAccessToken } from '@utils/jwt.utils.js';
import asyncHandler from '@utils/asyncHandler.utils.js';

export const verifyJWT = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const token =
    req.cookies?.accessToken ||
    req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    throw new ApiError(401, 'Unauthorized request');
  }

  const decoded = verifyAccessToken(token) as { _id: string };

  const user = await Admin.findById(decoded._id).select('-password -refreshToken');

  if (!user) {
    throw new ApiError(401, 'Invalid access token');
  }

  req.user = user;
  next();
});