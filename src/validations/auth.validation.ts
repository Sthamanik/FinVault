import validateWith from '@utils/validateWith.utils';
import { z } from 'zod';

const registerSchema = z.object({
    email: z
        .email('Invalid email address')
        .toLowerCase(),
    password: z
        .string()
        .min(8, 'Password should be at least 8 character long')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$!%*?&])/,
        'Password must contain at least one uppercase, lowercase, number and special character'
        ), 
})

export const loginSchema = z.object({
    email: z
        .email('Invalid email address')
        .toLowerCase(),
    password: z
        .string()
        .min(1, 'Password cannot be empty')
});

export const changePasswordSchema = z.object({
    currentPassword: z
        .string()
        .min(1, 'Current password cannot be empty'),
    newPassword: z
        .string() 
        .min(8, 'New password should be at least 8 character long')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$!%*?&])/)   
})

export const refreshTokenSchema = z.object({
    refreshToken: z
        .string()
        .min(1, 'Refresh token is required'),
});

export const validateRegisterAdmin = validateWith(registerSchema);
export const validateLogin = validateWith(loginSchema);
export const validateChangePassword = validateWith(changePasswordSchema);
export const validateRefreshToken = validateWith(refreshTokenSchema)