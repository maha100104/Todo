import { Controller, Get, Post, Delete, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { JwtAuthGuard } from '../guard/jwt-auth-guard';
import { GetUser } from '../customDecorator/getProfile';

@Controller('wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post(':productId')
  add(@GetUser() user: any, @Param('productId', ParseIntPipe) productId: number) {
    return this.wishlistService.addWishlistItem(user.id, productId);
  }

  @Get()
  get(@GetUser() user: any) {
    return this.wishlistService.getWishlist(user.id);
  }

  @Delete(':productId')
  remove(@GetUser() user: any, @Param('productId', ParseIntPipe) productId: number) {
    return this.wishlistService.removeWishlistItem(user.id, productId);
  }
}
