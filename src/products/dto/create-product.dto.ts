import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(2000).nullable().optional(),
  price: z.number().positive().max(99_999_999.99),
  stock: z.number().int().nonnegative().default(0),
});

export type CreateProductDto = z.infer<typeof createProductSchema>;