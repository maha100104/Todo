import { Controller, Get, Post, Put, Delete, Body, Query, Param, UseGuards, ParseIntPipe, UnauthorizedException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../guard/jwt-auth-guard';
import { GetUser } from '../customDecorator/getProfile';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll(
    @GetUser() user: any,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('showInactive') showInactiveQuery?: string
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const minPriceNum = minPrice ? parseFloat(minPrice) : undefined;
    const maxPriceNum = maxPrice ? parseFloat(maxPrice) : undefined;
    const showInactive = user.role === 'admin' && showInactiveQuery === 'true';
    return this.productsService.getProducts(limitNum, cursor, category, search, minPriceNum, maxPriceNum, showInactive);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.getProductById(id);
  }

  @Post()
  async create(@GetUser() user: any, @Body() body: any) {
    if (user.role !== 'admin') {
      throw new UnauthorizedException('Only admin can add products');
    }
    return this.productsService.createProduct(body);
  }

  @Put(':id')
  async update(
    @GetUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any
  ) {
    if (user.role !== 'admin') {
      throw new UnauthorizedException('Only admin can update products');
    }
    return this.productsService.updateProduct(id, body);
  }

  @Delete(':id')
  async remove(@GetUser() user: any, @Param('id', ParseIntPipe) id: number) {
    if (user.role !== 'admin') {
      throw new UnauthorizedException('Only admin can remove products');
    }
    return this.productsService.removeProduct(id);
  }
}
