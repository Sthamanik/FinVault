import { z } from 'zod';
import { APPLICATION_STATUSES } from '@models/application.model.js';
import validateWith from '@utils/validateWith.utils';

const phoneRegex = /^\+?[1-9]\d{6,14}$/;

const createApplicationSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name too long')
    .trim(),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .toLowerCase(),
  phone: z
    .string()
    .regex(phoneRegex, 'Invalid phone number format')
    .optional(),
  coverLetter: z
    .string()
    .max(2000, 'Cover letter too long')
    .trim()
    .optional(),
  // coverLetterFile handled via req.file — not in body schema
}).refine(
  (data) => !data.coverLetter || data.coverLetter.length >= 100,
  {
    message: 'Written cover letter must be at least 100 characters',
    path: ['coverLetter'],
  }
);

const updateApplicationStatusSchema = z.object({
  status: z.enum(APPLICATION_STATUSES).refine(
    (val) => APPLICATION_STATUSES.includes(val), {
        message: "Invalid application status"
    }
  ),
});

export const validateCreateApplication = validateWith(createApplicationSchema);
export const validateUpdateApplicationStatus = validateWith(updateApplicationStatusSchema);