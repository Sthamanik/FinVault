import { z } from 'zod';
import { CONTACT_STATUSES, CONTACT_SUBJECTS } from '@models/contact.model.js';
import validateWith from '@utils/validateWith.utils';

const phoneRegex = /^\+?[1-9]\d{6,14}$/;

const createContactSchema = z.object({
    name: z
        .string()
        .min(1, 'Name is required')
        .max(100, 'Name too long')
        .trim(),
    email: z
        .email('Invalid email address')
        .toLowerCase(),
    phone: z
        .string()
        .regex(phoneRegex, 'Invalid phone number format')
        .optional(),
    subject: z.enum(CONTACT_SUBJECTS).refine((val) => CONTACT_SUBJECTS.includes(val),{
        message: 'Invalid contact subject',
    }),
    message: z
        .string()
        .min(10, 'Message must be at least 10 characters')
        .max(1000, 'Message too long')
        .trim(),
});

const updateContactStatusSchema = z.object({
    status: z.enum(CONTACT_STATUSES).refine(
        (val) => CONTACT_STATUSES.includes(val),{
            message: 'Invaid contact status',
        }),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactStatusInput = z.infer<typeof updateContactStatusSchema>;

export const validateCreateContact = validateWith(createContactSchema)
export const validateUpdateContactStatus = validateWith(updateContactStatusSchema)