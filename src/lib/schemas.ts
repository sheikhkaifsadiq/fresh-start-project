/**
 * @file src/lib/schemas.ts
 * @description Complete Zod validation schemas for the Aegis Route API.
 * All schemas are exported for use across API route handlers.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Auth Schemas
// ---------------------------------------------------------------------------

/**
 * Schema for user signup requests.
 */
export const SignupSchema = z.object({
  email: z
    .string({ required_error: 'Email is required.' })
    .email({ message: 'A valid email address is required.' })
    .max(254, { message: 'Email must not exceed 254 characters.' })
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: 'Password is required.' })
    .min(8, { message: 'Password must be at least 8 characters long.' })
    .max(128, { message: 'Password must not exceed 128 characters.' }),
  name: z
    .string({ required_error: 'Name is required.' })
    .min(1, { message: 'Name cannot be empty.' })
    .max(100, { message: 'Name must not exceed 100 characters.' })
    .trim(),
});

export type SignupInput = z.infer<typeof SignupSchema>;

/**
 * Schema for user login requests.
 */
export const LoginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required.' })
    .email({ message: 'A valid email address is required.' })
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: 'Password is required.' })
    .min(1, { message: 'Password cannot be empty.' }),
});

export type LoginInput = z.infer<typeof LoginSchema>;

// ---------------------------------------------------------------------------
// Link Schemas
// ---------------------------------------------------------------------------

/**
 * Schema for creating a new link.
 */
export const CreateLinkSchema = z.object({
  slug: z
    .string({ required_error: 'Slug is required.' })
    .min(1, { message: 'Slug cannot be empty.' })
    .max(50, { message: 'Slug must not exceed 50 characters.' })
    .regex(/^[a-z0-9-_]+$/, {
      message:
        'Slug may only contain lowercase letters, numbers, hyphens, and underscores.',
    })
    .trim(),
  targetUrl: z
    .string({ required_error: 'Target URL is required.' })
    .url({ message: 'Target URL must be a valid URL.' })
    .max(2048, { message: 'Target URL must not exceed 2048 characters.' }),
  title: z
    .string({ required_error: 'Title is required.' })
    .min(1, { message: 'Title cannot be empty.' })
    .max(100, { message: 'Title must not exceed 100 characters.' })
    .trim(),
  description: z
    .string()
    .max(250, { message: 'Description must not exceed 250 characters.' })
    .trim()
    .optional()
    .nullable(),
  isActive: z.boolean().default(true),
  expiresAt: z
    .string()
    .datetime({ message: 'expiresAt must be a valid ISO 8601 datetime string.' })
    .optional()
    .nullable(),
});

export type CreateLinkInput = z.infer<typeof CreateLinkSchema>;

/**
 * Schema for updating an existing link. All fields are optional.
 */
export const UpdateLinkSchema = z.object({
  slug: z
    .string()
    .min(1, { message: 'Slug cannot be empty.' })
    .max(50, { message: 'Slug must not exceed 50 characters.' })
    .regex(/^[a-z0-9-_]+$/, {
      message:
        'Slug may only contain lowercase letters, numbers, hyphens, and underscores.',
    })
    .trim()
    .optional(),
  targetUrl: z
    .string()
    .url({ message: 'Target URL must be a valid URL.' })
    .max(2048, { message: 'Target URL must not exceed 2048 characters.' })
    .optional(),
  title: z
    .string()
    .min(1, { message: 'Title cannot be empty.' })
    .max(100, { message: 'Title must not exceed 100 characters.' })
    .trim()
    .optional(),
  description: z
    .string()
    .max(250, { message: 'Description must not exceed 250 characters.' })
    .trim()
    .optional()
    .nullable(),
  isActive: z.boolean().optional(),
  expiresAt: z
    .string()
    .datetime({ message: 'expiresAt must be a valid ISO 8601 datetime string.' })
    .optional()
    .nullable(),
});

export type UpdateLinkInput = z.infer<typeof UpdateLinkSchema>;

// ---------------------------------------------------------------------------
// Redirect Rule Schemas
// ---------------------------------------------------------------------------

/**
 * Supported redirect rule types.
 */
export const RuleTypeEnum = z.enum([
  'geo',
  'device',
  'language',
  'time_window',
  'query_param',
  'referrer',
  'custom_header',
]);

export type RuleType = z.infer<typeof RuleTypeEnum>;

/**
 * Schema for creating a redirect rule.
 */
export const RedirectRuleSchema = z.object({
  priority: z
    .number({ required_error: 'Priority is required.' })
    .int({ message: 'Priority must be an integer.' })
    .min(0, { message: 'Priority must be a non-negative integer.' })
    .max(9999, { message: 'Priority must not exceed 9999.' }),
  ruleType: RuleTypeEnum,
  ruleValue: z
    .string({ required_error: 'Rule value is required.' })
    .min(1, { message: 'Rule value cannot be empty.' })
    .max(500, { message: 'Rule value must not exceed 500 characters.' })
    .trim(),
  targetUrl: z
    .string({ required_error: 'Target URL is required.' })
    .url({ message: 'Target URL must be a valid URL.' })
    .max(2048, { message: 'Target URL must not exceed 2048 characters.' }),
  isActive: z.boolean().default(true),
  description: z
    .string()
    .max(250, { message: 'Description must not exceed 250 characters.' })
    .trim()
    .optional()
    .nullable(),
});

export type RedirectRuleInput = z.infer<typeof RedirectRuleSchema>;

/**
 * Schema for updating a redirect rule. All fields are optional.
 */
export const UpdateRedirectRuleSchema = RedirectRuleSchema.partial();

export type UpdateRedirectRuleInput = z.infer<typeof UpdateRedirectRuleSchema>;

// ---------------------------------------------------------------------------
// ML Model Schemas
// ---------------------------------------------------------------------------

/**
 * Schema for ML model metadata when creating/deploying a model.
 */
export const MlModelSchema = z.object({
  name: z
    .string({ required_error: 'Model name is required.' })
    .min(1, { message: 'Model name cannot be empty.' })
    .max(100, { message: 'Model name must not exceed 100 characters.' })
    .trim(),
  version: z
    .string({ required_error: 'Model version is required.' })
    .min(1, { message: 'Version cannot be empty.' })
    .max(50, { message: 'Version must not exceed 50 characters.' })
    .trim(),
  description: z
    .string()
    .max(1000, { message: 'Description must not exceed 1000 characters.' })
    .trim()
    .optional()
    .nullable(),
  modelType: z.enum(['bot_detection', 'traffic_classification', 'anomaly_detection'], {
    required_error: 'Model type is required.',
  }),
  storagePath: z
    .string({ required_error: 'Storage path is required.' })
    .min(1, { message: 'Storage path cannot be empty.' })
    .max(500, { message: 'Storage path must not exceed 500 characters.' })
    .trim(),
  accuracy: z
    .number()
    .min(0)
    .max(1, { message: 'Accuracy must be between 0 and 1.' })
    .optional()
    .nullable(),
  isActive: z.boolean().default(false),
});

export type MlModelInput = z.infer<typeof MlModelSchema>;

/**
 * Schema for updating ML model metadata.
 */
export const UpdateMlModelSchema = MlModelSchema.partial();

export type UpdateMlModelInput = z.infer<typeof UpdateMlModelSchema>;

// ---------------------------------------------------------------------------
// Query / Pagination Schemas
// ---------------------------------------------------------------------------

/**
 * Schema for common pagination and search query parameters.
 */
export const PaginationSchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1, { message: 'Page must be at least 1.' })
    .default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1, { message: 'Limit must be at least 1.' })
    .max(100, { message: 'Limit must not exceed 100.' })
    .default(20),
  q: z.string().trim().optional(),
  sort: z.string().trim().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationInput = z.infer<typeof PaginationSchema>;

/**
 * Schema for audit log query parameters.
 */
export const AuditLogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  event_type: z.string().trim().optional(),
  date_from: z
    .string()
    .datetime({ message: 'date_from must be a valid ISO 8601 datetime.' })
    .optional(),
  date_to: z
    .string()
    .datetime({ message: 'date_to must be a valid ISO 8601 datetime.' })
    .optional(),
  ip_address: z.string().trim().optional(),
});

export type AuditLogQueryInput = z.infer<typeof AuditLogQuerySchema>;
