import { Request, Response, NextFunction } from 'express';
import Admin from '@models/admin.model.js';
import { ApiError } from '@utils/apiError.utils.js';
import { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken } from '@utils/jwt.utils.js';
import asyncHandler from '@utils/asyncHandler.utils.js';

export const verifyJWT = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const accessToken = req.cookies?.accessToken;
  const refreshToken = req.cookies?.refreshToken;

  if (!accessToken && !refreshToken) {
    throw new ApiError(401, 'Please login first');
  }

  if (accessToken) {
    try {
      const decoded = verifyAccessToken(accessToken) as { _id: string };
      
      const user = await Admin.findById(decoded._id).select('-password -refreshToken');
      if (!user) {
        throw new ApiError(401, 'Invalid access token');
      }
      
      req.user = user;
      return next();
    } catch (err) {
      if (err instanceof ApiError) throw err; // invalid user → reject
      // jwt expiry error → fall through to refresh flow
    }
  }

  if (!refreshToken) {
    throw new ApiError(401, 'Session expired, please login again');
  }

  let decoded: { _id: string };
  try {
    decoded = verifyRefreshToken(refreshToken) as { _id: string };
  } catch {
    throw new ApiError(401, 'Session expired, please login again');
  }

  const admin = await Admin.findById(decoded._id).select('-password');
  if (!admin) {
    throw new ApiError(401, 'Invalid refresh token');
  }

  if (refreshToken !== admin.refreshToken) {
    throw new ApiError(401, 'Refresh token is expired or used');
  }

  const newAccessToken = generateAccessToken(admin);
  const newRefreshToken = generateRefreshToken(admin);

  admin.refreshToken = newRefreshToken;
  await admin.save({ validateBeforeSave: false });

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 3 * 24 * 60 * 60 * 1000, 
  }

  res
    .cookie('accessToken', newAccessToken, { ...cookieOptions, maxAge: 5 * 60 * 1000 })
    .cookie('refreshToken', newRefreshToken, cookieOptions);

  req.user = admin;
  return next();
});