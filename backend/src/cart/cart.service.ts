import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../db/db';
import { cart, products } from '../schema/user.schema';
import { eq, and } from 'drizzle-orm';

@Injectable()
export class CartService {
  async addToCart(userId: number, productId: number, quantity: number = 1) {
    // 1. Verify if product exists
    const prodExists = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (prodExists.length === 0) {
      throw new NotFoundException('Product not found');
    }

    // 2. Check if already exists in cart
    const existing = await db
      .select()
      .from(cart)
      .where(
        and(
          eq(cart.userId, userId),
          eq(cart.productId, productId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      const isItemActive = existing[0].isActive;
      const newQty = isItemActive ? (existing[0].quantity + quantity) : quantity;
      await db
        .update(cart)
        .set({ quantity: newQty, isActive: true, updatedAt: new Date() })
        .where(eq(cart.id, existing[0].id));

      return { message: 'Cart quantity updated', productId, quantity: newQty };
    }

    // 3. Insert new cart item
    await db.insert(cart).values({
      userId,
      productId,
      quantity
    });

    return { message: 'Product added to cart successfully', productId, quantity };
  }

  async getCart(userId: number) {
    const items = await db
      .select({
        id: cart.id,
        userId: cart.userId,
        productId: cart.productId,
        quantity: cart.quantity,
        createdAt: cart.createdAt,
        updatedAt: cart.updatedAt,
        product: products
      })
      .from(cart)
      .innerJoin(products, eq(cart.productId, products.id))
      .where(
        and(
          eq(cart.userId, userId),
          eq(cart.isActive, true)
        )
      );

    return items;
  }

  async updateQuantity(userId: number, productId: number, quantity: number) {
    if (quantity <= 0) {
      return this.removeFromCart(userId, productId);
    }

    const existing = await db
      .select()
      .from(cart)
      .where(
        and(
          eq(cart.userId, userId),
          eq(cart.productId, productId),
          eq(cart.isActive, true)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      throw new NotFoundException('Cart item not found');
    }

    await db
      .update(cart)
      .set({ quantity, updatedAt: new Date() })
      .where(eq(cart.id, existing[0].id));

    return { message: 'Cart quantity updated successfully', productId, quantity };
  }

  async removeFromCart(userId: number, productId: number) {
    const existing = await db
      .select()
      .from(cart)
      .where(
        and(
          eq(cart.userId, userId),
          eq(cart.productId, productId)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      throw new NotFoundException('Cart item not found');
    }

    await db
      .update(cart)
      .set({ isActive: false })
      .where(
        and(
          eq(cart.userId, userId),
          eq(cart.productId, productId)
        )
      );

    return { message: 'Product removed from cart successfully', productId };
  }

  async clearCart(userId: number) {
    await db
      .update(cart)
      .set({ isActive: false })
      .where(
        and(
          eq(cart.userId, userId),
          eq(cart.isActive, true)
        )
      );

    return { message: 'Cart cleared successfully' };
  }
}
