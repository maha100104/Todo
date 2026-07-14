import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../db/db';
import { wishlist, products } from '../schema/user.schema';
import { eq, and } from 'drizzle-orm';

@Injectable()
export class WishlistService {
  async addWishlistItem(userId: number, productId: number) {
    // 1. Verify if product exists
    const prodExists = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (prodExists.length === 0) {
      throw new NotFoundException('Product not found');
    }

    // 2. Check if already in wishlist
    const existing = await db
      .select()
      .from(wishlist)
      .where(
        and(
          eq(wishlist.userId, userId),
          eq(wishlist.productId, productId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return { message: 'Product already in wishlist', item: existing[0] };
    }

    // 3. Insert new wishlist item
    await db.insert(wishlist).values({
      userId,
      productId
    });

    return { message: 'Product added to wishlist successfully' };
  }

  async getWishlist(userId: number) {
    const items = await db
      .select({
        id: wishlist.id,
        userId: wishlist.userId,
        productId: wishlist.productId,
        createdAt: wishlist.createdAt,
        product: products
      })
      .from(wishlist)
      .innerJoin(products, eq(wishlist.productId, products.id))
      .where(eq(wishlist.userId, userId));

    return items;
  }

  async removeWishlistItem(userId: number, productId: number) {
    const existing = await db
      .select()
      .from(wishlist)
      .where(
        and(
          eq(wishlist.userId, userId),
          eq(wishlist.productId, productId)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      throw new NotFoundException('Wishlist item not found');
    }

    await db
      .delete(wishlist)
      .where(
        and(
          eq(wishlist.userId, userId),
          eq(wishlist.productId, productId)
        )
      );

    return { message: 'Product removed from wishlist successfully' };
  }
}
