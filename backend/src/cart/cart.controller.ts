import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, ParseIntPipe } from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../guard/jwt-auth-guard';
import { GetUser } from '../customDecorator/getProfile';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post()
  add(
    @GetUser() user: any,
    @Body('productId', ParseIntPipe) productId: number,
    @Body('quantity') quantity?: number
  ) {
    return this.cartService.addToCart(user.id, productId, quantity || 1);
  }

  @Get()
  get(@GetUser() user: any) {
    return this.cartService.getCart(user.id);
  }

  @Patch(':productId')
  updateQuantity(
    @GetUser() user: any,
    @Param('productId', ParseIntPipe) productId: number,
    @Body('quantity', ParseIntPipe) quantity: number
  ) {
    return this.cartService.updateQuantity(user.id, productId, quantity);
  }

  @Delete('clear')
  clear(@GetUser() user: any) {
    return this.cartService.clearCart(user.id);
  }

  @Delete(':productId')
  remove(
    @GetUser() user: any,
    @Param('productId', ParseIntPipe) productId: number
  ) {
    return this.cartService.removeFromCart(user.id, productId);
  }
}
