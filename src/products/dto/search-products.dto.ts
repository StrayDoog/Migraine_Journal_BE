import { z } from 'zod';

export const searchProductsSchema = z.object({
  name: z.string().trim().min(1).max(100),
});

export type SearchProductsDto = z.infer<typeof searchProductsSchema>;