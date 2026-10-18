import { z } from 'zod';
import { createProductSchema } from './create-product.dto';

export const updateProductSchema = createProductSchema
  .omit({ stock: true })
  .extend({ stock: z.number().int().nonnegative() })
  .partial()
  .refine((product) => Object.keys(product).length > 0, {
    message: 'At least one product field must be provided',
  });

export type UpdateProductDto = z.infer<typeof updateProductSchema>;