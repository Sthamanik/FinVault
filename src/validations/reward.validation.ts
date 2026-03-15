import validateWith from '@utils/validateWith.utils';
import { z } from 'zod';

const urlRegex = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)$/;

export const createRewardSchema = z.object({
  title: z.string().min(1, 'Title is required').trim(),
  issuer: z.string().min(1, 'Issuer is required').trim(),
  description: z.string().trim().optional(),
  credentialUrl: z
    .string()
    .regex(urlRegex, 'Invalid credential URL')
    .optional(),
  issueDate: z.coerce.date().optional(),
});

export const validateCreateReward = validateWith(createRewardSchema);
export const validateUpdateReward = validateWith(createRewardSchema.partial())