import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  CreateProductDto,
  createProductSchema,
} from './dto/create-product.dto';
import { productIdSchema } from './dto/product-id.dto';
import {
  SearchProductsDto,
  searchProductsSchema,
} from './dto/search-products.dto';
import {
  UpdateProductDto,
  updateProductSchema,
} from './dto/update-product.dto';
import { ProductService } from './products.service';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  create(
    @Body(new ZodValidationPipe(createProductSchema))
    createProductDto: CreateProductDto,
  ) {
    return this.productService.create(createProductDto);
  }

  @Patch(':id')
  update(
    @Param('id', new ZodValidationPipe(productIdSchema)) id: string,
    @Body(new ZodValidationPipe(updateProductSchema))
    updateProductDto: UpdateProductDto,
  ) {
    return this.productService.update(id, updateProductDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', new ZodValidationPipe(productIdSchema)) id: string,
  ): Promise<void> {
    return this.productService.remove(id);
  }

  @Get('search')
  search(
    @Query(new ZodValidationPipe(searchProductsSchema))
    query: SearchProductsDto,
  ) {
    return this.productService.searchByName(query.name);
  }

  @Get(':id')
  findOne(
    @Param('id', new ZodValidationPipe(productIdSchema)) id: string,
  ) {
    return this.productService.findOne(id);
  }

  @Get()
  findAll() {
    return this.productService.findAll();
  }
}