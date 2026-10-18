import { NotFoundException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, isActive: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  create(data: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        ...data,
        price: new Prisma.Decimal(data.price),
      },
    });
  }

  update(id: string, data: UpdateProductDto) {
    const { price, ...productData } = data;

    return this.updateActiveProduct(id, {
      ...productData,
      ...(price === undefined ? {} : { price: new Prisma.Decimal(price) }),
    });
  }

  async remove(id: string): Promise<void> {
    await this.updateActiveProduct(id, { isActive: false });
  }

  findAll() {
    return this.prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  searchByName(name: string) {
    return this.prisma.product.findMany({
      where: {
        isActive: true,
        name: { contains: name, mode: 'insensitive' },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async updateActiveProduct(
    id: string,
    data: Prisma.ProductUpdateInput,
  ) {
    try {
      return await this.prisma.product.update({
        where: { id, isActive: true },
        data,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Product not found');
      }

      throw error;
    }
  }
}