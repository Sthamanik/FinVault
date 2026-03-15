import { z, ZodError, ZodIssue } from 'zod';
import { Request, Response, NextFunction } from 'express';
import {ApiError} from '@utils/apiError.utils.js';

const validateWith = (schema: z.ZodTypeAny) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = (result.error as ZodError).issues.map((issue: ZodIssue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return next(new ApiError(400, 'Validation failed', errors));
    }

    req.body = result.data;
    next();
  };
};

export default validateWith;