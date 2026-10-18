import { z } from 'zod';

const environmentSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().regex(/^[1-9]\d*(s|m|h|d)$/),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  CORS_ORIGIN: z.string().min(1).optional(),
});

export function validateEnvironment(config: Record<string, unknown>) {
  return environmentSchema.parse(config);
}