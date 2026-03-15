import jwt, {SignOptions} from "jsonwebtoken";
import { Types } from "mongoose";

interface TokenPayload {
  _id: Types.ObjectId;
  email: string;
}

const accessTokenOptions: SignOptions = {
  expiresIn:
    (process.env.ACCESS_TOKEN_EXPIRY as SignOptions["expiresIn"]) || "15m",
};

const refreshTokenOptions: SignOptions = {
  expiresIn:
    (process.env.REFRESH_TOKEN_EXPIRY as SignOptions["expiresIn"]) || "7d",
};

export const generateAccessToken = (user: TokenPayload): string => {
  return jwt.sign(
    {
      _id: user._id,
      email: user.email,
    },
    process.env.ACCESS_TOKEN_SECRET!,
    accessTokenOptions
  );
};

export const generateRefreshToken = (user: TokenPayload): string => {
  return jwt.sign(
    {
      _id: user._id,
    },
    process.env.REFRESH_TOKEN_SECRET!,
    refreshTokenOptions
  );
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!);
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET!);
};