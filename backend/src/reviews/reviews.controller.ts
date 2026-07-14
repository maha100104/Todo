import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../guard/jwt-auth-guard';
import { GetUser } from '../customDecorator/getProfile';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('product/:productId')
  getReviewsForProduct(@Param('productId', ParseIntPipe) productId: number) {
    return this.reviewsService.getReviewsForProduct(productId);
  }

  @Get('user')
  @UseGuards(JwtAuthGuard)
  getUserReviews(@GetUser() user: any) {
    return this.reviewsService.getUserReviews(user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  addReview(@GetUser() user: any, @Body() body: any) {
    return this.reviewsService.addReview(user.id, body);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  updateReview(
    @GetUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any
  ) {
    return this.reviewsService.updateReview(user.id, id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  deleteReview(
    @GetUser() user: any,
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.reviewsService.deleteReview(user.id, user.role, id);
  }
}
