import { Controller, Get, Post, Put, Param, Body, UseGuards, ParseIntPipe, UnauthorizedException, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../guard/jwt-auth-guard';
import { GetUser } from '../customDecorator/getProfile';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@GetUser() user: any, @Body() body: any) {
    return this.ordersService.createOrder(user.id, body);
  }

  @Get()
  getAll(@GetUser() user: any, @Query('search') search?: string, @Query('status') status?: string, @Query('priceMin') priceMin?: string, @Query('priceMax') priceMax?: string) {
    return this.ordersService.getOrders(user.id, user.role, search, status, priceMin, priceMax);
  }

  @Get('statuses')
  getStatuses() {
    return this.ordersService.getStatuses();
  }

  @Get(':id')
  getOne(@GetUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.ordersService.getOrderById(user.id, id, user.role);
  }

  @Put(':id/status')
  async updateStatus(
    @GetUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: string
  ) {
    if (user.role !== 'admin') {
      throw new UnauthorizedException('Only admin can update order status');
    }
    return this.ordersService.updateOrderStatus(id, status);
  }

  @Put(':id/cancel')
  async cancel(
    @GetUser() user: any,
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.ordersService.cancelOrder(user.id, id, user.role);
  }
}
