import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { db } from '../db/db';
import { reviews, orders, orderItems, users } from '../schema/user.schema';
import { eq, and, desc } from 'drizzle-orm';

@Injectable()
export class ReviewsService {
  async addReview(userId: number, body: { productId: number; rating: number; comment: string }) {
    const { productId, rating, comment } = body;

    if (!productId || !rating || !comment || comment.trim() === '') {
      throw new BadRequestException('Product ID, rating (1-5), and comment are required.');
    }

    if (rating < 1 || rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5.');
    }

    // 1. Validate if user has a delivered order for this product
    const deliveredOrders = await db
      .select({ productId: orderItems.productId })
      .from(orders)
      .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
      .where(
        and(
          eq(orders.userId, userId),
          eq(orders.status, 'delivered'),
          eq(orderItems.productId, productId)
        )
      );

    if (deliveredOrders.length === 0) {
      throw new BadRequestException('You can only review products that have been delivered to you.');
    }

    // 2. Validate if user already reviewed this product
    const existing = await db
      .select()
      .from(reviews)
      .where(and(eq(reviews.userId, userId), eq(reviews.productId, productId)))
      .limit(1);

    if (existing.length > 0) {
      throw new BadRequestException('You have already reviewed this product. Please edit your existing review instead.');
    }

    // 3. Insert review
    await db.insert(reviews).values({
      userId,
      productId,
      rating,
      comment: comment.trim(),
    });

    return { message: 'Review added successfully!' };
  }

  async updateReview(userId: number, reviewId: number, body: { rating: number; comment: string }) {
    const { rating, comment } = body;

    if (!rating || !comment || comment.trim() === '') {
      throw new BadRequestException('Rating (1-5) and comment are required.');
    }

    if (rating < 1 || rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5.');
    }

    // Check if review exists and belongs to the user
    const existing = await db
      .select()
      .from(reviews)
      .where(eq(reviews.id, reviewId))
      .limit(1);

    if (existing.length === 0) {
      throw new NotFoundException('Review not found.');
    }

    if (existing[0].userId !== userId) {
      throw new ForbiddenException('You do not have permission to update this review.');
    }

    await db
      .update(reviews)
      .set({
        rating,
        comment: comment.trim(),
        updatedAt: new Date(),
      })
      .where(eq(reviews.id, reviewId));

    return { message: 'Review updated successfully!' };
  }

  async deleteReview(userId: number, userRole: string, reviewId: number) {
    const existing = await db
      .select()
      .from(reviews)
      .where(eq(reviews.id, reviewId))
      .limit(1);

    if (existing.length === 0) {
      throw new NotFoundException('Review not found.');
    }

    // Allow deleting if user is the author or an admin
    if (existing[0].userId !== userId && userRole !== 'admin') {
      throw new ForbiddenException('You do not have permission to delete this review.');
    }

    await db.delete(reviews).where(eq(reviews.id, reviewId));

    return { message: 'Review deleted successfully!' };
  }

  async getReviewsForProduct(productId: number) {
    const results = await db
      .select({
        id: reviews.id,
        userId: reviews.userId,
        productId: reviews.productId,
        rating: reviews.rating,
        comment: reviews.comment,
        createdAt: reviews.createdAt,
        reviewerName: users.name,
      })
      .from(reviews)
      .innerJoin(users, eq(reviews.userId, users.id))
      .where(eq(reviews.productId, productId))
      .orderBy(desc(reviews.createdAt));

    return results;
  }

  async getUserReviews(userId: number) {
    return db
      .select()
      .from(reviews)
      .where(eq(reviews.userId, userId));
  }
}
