import { z } from 'zod';
import { JOB_TYPES } from '@models/career.model.js';
import validateWith from '@utils/validateWith.utils';

const createCareerSchema = z.object({
  title: z.string().min(1, 'Job title is required').trim(),
  department: z.string().min(1, 'Department is required').trim(),
  location: z.string().min(1, 'Location is required').trim(),
  type: z.enum(JOB_TYPES).refine((val) => JOB_TYPES.includes(val),{
    message: 'Invalid job type'
  }),
  description: z.string().min(1, 'Description is required'),
  requirements: z
    .array(z.string().trim())
    .min(1, 'At least one requirement is needed'),
  openings: z.number().int().min(1, 'At least 1 opening is required').default(1),
  isActive: z.boolean().default(true),
});

const updateCareerSchema = createCareerSchema.partial();

export const ValidateCreateCareer = validateWith(createCareerSchema);
export const ValidateUpdateCareer = validateWith(updateCareerSchema);