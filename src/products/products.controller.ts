import { Controller, Get, Query } from '@nestjs/common';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  SearchProductsDto,
  searchProductsSchema,
} from './dto/search-products.dto';
import { ProductService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productService: ProductService) {}

  @Get('search')
  search(
    @Query(new ZodValidationPipe(searchProductsSchema))
    query: SearchProductsDto,
  ) {
    return this.productService.searchByName(query.name);
  }

  @Get()
  findAll() {
    return this.productService.findAll();
  }
}