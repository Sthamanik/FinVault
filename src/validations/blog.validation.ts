import validateWith from '@utils/validateWith.utils';
import { z } from 'zod';

const createBlogSchema = z.object({
    title: z
        .string()
        .min(1, 'Title is required')
        .trim(),
    content: z
        .string()
        .min(1, 'Content is required'),
    author: z
        .string()
        .trim()
        .default('Admin'),
    tags: z
        .array(
            z.string()
            .trim()
        )
        .optional()
        .default([]),
    category: z
        .string()
        .trim()
        .optional(),
    status: z
        .enum(['draft', 'published'])
        .default('draft'),
    metaTitle: z
        .string()
        .trim()
        .optional(),
    metaDescription: z
        .string()
        .trim()
        .optional(),
});

const updateBlogSchema = createBlogSchema.partial();

export const validateCreateBLog = validateWith(createBlogSchema);
export const validateUpdateBlog = validateWith(updateBlogSchema);