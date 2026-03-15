import validateWith from '@utils/validateWith.utils';
import { z } from 'zod';

const linkedinRegex = /^https:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?$/;
const twitterRegex = /^https:\/\/(www\.)?(twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/?$/;
const phoneRegex = /^\+?[1-9]\d{6,14}$/;

export const createTeamSchema = z.object({
    name: z
        .string()
        .min(1, 'Name is required')
        .trim(),
    role: z
        .string()
        .min(1, 'Role is required')
        .trim(),
    bio: z
        .string()
        .trim()
        .optional(),
    socialLinks: z
        .object({
        linkedin: z
            .string()
            .regex(linkedinRegex, 'Invalid LinkedIn profile URL')
            .optional(),
        twitter: z
            .string()
            .regex(twitterRegex, 'Invalid Twitter/X profile URL')
            .optional(),
        })
        .optional(),
    phone: z
        .string()
        .regex(phoneRegex, 'Invalid Phone number'),
    isActive: z
        .boolean()
        .default(true),
    order: z
        .number()
        .int()
        .nonnegative()
        .default(0),
});

export const ValidateCreateTeam = validateWith(createTeamSchema);
export const ValidateUpdateTeam = validateWith(createTeamSchema.partial())