import { z } from 'zod';
import { INDUSTRIES } from '@models/service.model.js';
import validateWith from '@utils/validateWith.utils';

const urlRegex = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)$/;

export const createServiceSchema = z.object({
    title: z.string().min(1, 'Title is required').trim(),
    shortDescription: z.string().min(1, 'Short description is required').trim(),
    longDescription: z.string().trim().optional(),
    ctaLink: z
        .string()
        .regex(urlRegex, 'Invalid CTA URL')
        .optional(),
    investmentFocus: z.string().trim().optional(),
    industriesPortfolio: z
        .array(z.enum(INDUSTRIES))
        .optional()
        .default([]),
    isActive: z.boolean().default(true),
    order: z.number().int().nonnegative().default(0),
});

export const validateCreateService = validateWith(createServiceSchema);
export const validateUpdateService = validateWith(createServiceSchema.partial())