import { jest } from '@jest/globals';
import { Prisma } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductService } from './products.service';

describe('ProductService', () => {
  let service: ProductService;
  let findMany: jest.Mock<(args: unknown) => Promise<unknown>>;
  let findFirst: jest.Mock<(args: unknown) => Promise<unknown>>;
  let create: jest.Mock<(args: unknown) => Promise<unknown>>;
  let update: jest.Mock<(args: unknown) => Promise<unknown>>;

  beforeEach(() => {
    findMany = jest.fn<(args: unknown) => Promise<unknown>>();
    findFirst = jest.fn<(args: unknown) => Promise<unknown>>();
    create = jest.fn<(args: unknown) => Promise<unknown>>();
    update = jest.fn<(args: unknown) => Promise<unknown>>();
    const prisma = {
      product: { findFirst, findMany, create, update },
    } as unknown as PrismaService;

    service = new ProductService(prisma);
  });

  it('returns an active product by id', async () => {
    const product = { id: 'product-1', name: 'Migraine journal' };
    findFirst.mockResolvedValue(product);

    await expect(service.findOne('product-1')).resolves.toBe(product);
    expect(findFirst).toHaveBeenCalledWith({
      where: { id: 'product-1', isActive: true },
    });
  });

  it('returns not found when the product does not exist or is inactive', async () => {
    findFirst.mockResolvedValue(null);

    await expect(service.findOne('missing-id')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('creates a product with a Decimal price', async () => {
    const product = { id: 'product-1', name: 'Migraine journal' };
    create.mockResolvedValue(product);

    await expect(
      service.create({
        name: 'Migraine journal',
        price: 19.99,
        stock: 5,
      }),
    ).resolves.toBe(product);
    expect(create).toHaveBeenCalledWith({
      data: {
        name: 'Migraine journal',
        price: expect.any(Prisma.Decimal),
        stock: 5,
      },
    });
  });

  it('updates an active product', async () => {
    const product = { id: 'product-1', name: 'Updated journal' };
    update.mockResolvedValue(product);

    await expect(
      service.update('product-1', { name: 'Updated journal', price: 24.5 }),
    ).resolves.toBe(product);
    expect(update).toHaveBeenCalledWith({
      where: { id: 'product-1', isActive: true },
      data: {
        name: 'Updated journal',
        price: expect.any(Prisma.Decimal),
      },
    });
  });

  it('soft deletes an active product', async () => {
    update.mockResolvedValue({ id: 'product-1', isActive: false });

    await expect(service.remove('product-1')).resolves.toBeUndefined();
    expect(update).toHaveBeenCalledWith({
      where: { id: 'product-1', isActive: true },
      data: { isActive: false },
    });
  });

  it('returns not found when updating a missing product', async () => {
    update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Record not found', {
        code: 'P2025',
        clientVersion: 'test',
      }),
    );

    await expect(service.update('missing-id', { name: 'Updated' })).rejects.toThrow(
      NotFoundException,
    );
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

  it('searches active products by name without case sensitivity', async () => {
    const products = [{ id: 'product-1', name: 'Migraine Journal' }];
    findMany.mockResolvedValue(products);

    await expect(service.searchByName('journal')).resolves.toBe(products);
    expect(findMany).toHaveBeenCalledWith({
      where: {
        isActive: true,
        name: { contains: 'journal', mode: 'insensitive' },
      },
      orderBy: { createdAt: 'desc' },
    });
  });
});