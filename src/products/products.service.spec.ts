import { jest } from '@jest/globals';
import { PrismaService } from '../prisma/prisma.service';
import { ProductService } from './products.service';

describe('ProductService', () => {
  let service: ProductService;
  let findMany: jest.Mock<(args: unknown) => Promise<unknown>>;

  beforeEach(() => {
    findMany = jest.fn<(args: unknown) => Promise<unknown>>();
    const prisma = {
      product: { findMany },
    } as unknown as PrismaService;

    service = new ProductService(prisma);
  });

  it('returns active products ordered by newest first', async () => {
    const products = [{ id: 'product-1', name: 'Migraine journal' }];
    findMany.mockResolvedValue(products);

    await expect(service.findAll()).resolves.toBe(products);
    expect(findMany).toHaveBeenCalledWith({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  });
});