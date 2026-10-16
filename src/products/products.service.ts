import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

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
}