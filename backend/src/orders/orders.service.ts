import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../db/db';
import { orders, orderItems, addresses, users, cart, orderStatuses } from '../schema/user.schema';
import { eq, and, ne } from 'drizzle-orm';

type AddressRow = typeof addresses.$inferSelect;

@Injectable()
export class OrdersService {
  async getStatuses() {
    return db.select().from(orderStatuses);
  }

  async createOrder(userId: number, body: any) {
    const { totalAmount, txnId, paymentMethod, addressId, items } = body;

    const [inserted] = await db.insert(orders).values({
      userId,
      totalAmount,
      txnId,
      paymentMethod,
      addressId: addressId || null,
      status: 'ordered',
    }).$returningId();

    const orderId = inserted.id;

    if (items && items.length > 0) {
      console.log("createOrder items payload:", JSON.stringify(items, null, 2));
      await db.insert(orderItems).values(
        items.map((item: any) => ({
          orderId,
          productId: item.productId || null,
          quantity: item.quantity,
          price: item.price,
          title: item.title,
          thumbnail: item.thumbnail || null,
        }))
      );
    }

    return { message: 'Order placed successfully', orderId, txnId };
  }

  async getOrders(userId: number, role?: string, search?: string, status?: string, priceMin?: string, priceMax?: string) {
    let userOrders;
    if (role === 'admin') {
      userOrders = await db
        .select()
        .from(orders)
        .orderBy(orders.createdAt);
    } else {
      userOrders = await db
        .select()
        .from(orders)
        .where(eq(orders.userId, userId))
        .orderBy(orders.createdAt);
    }

    const ordersWithItems = await Promise.all(
      userOrders.map(async (order) => {
        const items = await db
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, order.id));

        let address: AddressRow | null = null;
        if (order.addressId) {
          const addrRows = await db
            .select()
            .from(addresses)
            .where(eq(addresses.id, order.addressId))
            .limit(1);
          address = addrRows[0] ?? null;
        }

        let orderUser: { name: string; email: string } | null = null;
        if (role === 'admin') {
          const userRows = await db
            .select({ name: users.name, email: users.email })
            .from(users)
            .where(eq(users.id, order.userId))
            .limit(1);
          orderUser = userRows[0] ?? null;
        }

        return { ...order, items, address, user: orderUser };
      })
    );

    // Apply optional filters
    let filtered = ordersWithItems;
    if (search && search.trim() !== '') {
      const lower = search.trim().toLowerCase();
      filtered = filtered.filter((o) => {
        const userInfo = o.user;
        return (
          (userInfo?.name && userInfo.name.toLowerCase().includes(lower)) ||
          (userInfo?.email && userInfo.email.toLowerCase().includes(lower))
        );
      });
    }
    if (status && status.trim() !== '') {
      filtered = filtered.filter((o) => o.status === status.trim());
    }
    return filtered.reverse(); // newest first
  }

  async getOrderById(userId: number, orderId: number, role?: string) {
    const orderRows = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (orderRows.length === 0 || (orderRows[0].userId !== userId && role !== 'admin')) {
      throw new NotFoundException('Order not found');
    }

    const order = orderRows[0];
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));

    let address: AddressRow | null = null;
    if (order.addressId) {
      const addrRows = await db.select().from(addresses).where(eq(addresses.id, order.addressId)).limit(1);
      address = addrRows[0] ?? null;
    }

    let orderUser: { name: string; email: string } | null = null;
    if (role === 'admin') {
      const userRows = await db
        .select({ name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, order.userId))
        .limit(1);
      orderUser = userRows[0] ?? null;
    }

    return { ...order, items, address, user: orderUser };
  }

  async updateOrderStatus(orderId: number, status: string) {
    const dbStatuses = await this.getStatuses();
    const validStatuses = dbStatuses.map((s) => s.key);
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid order status');
    }

    const orderRows = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (orderRows.length === 0) {
      throw new NotFoundException('Order not found');
    }

    const order = orderRows[0];

    await db.update(orders)
      .set({ status })
      .where(eq(orders.id, orderId));

    if (status === 'rejected') {
      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));

      for (const item of items) {
        if (item.productId) {
          const existingCart = await db
            .select()
            .from(cart)
            .where(
              and(
                eq(cart.userId, order.userId),
                eq(cart.productId, item.productId)
              )
            )
            .limit(1);

          if (existingCart.length > 0) {
            await db.update(cart)
              .set({ isActive: false })
              .where(eq(cart.id, existingCart[0].id));
          } else {
            await db.insert(cart).values({
              userId: order.userId,
              productId: item.productId,
              quantity: item.quantity,
              isActive: false
            });
          }
        }
      }
    }

    return { message: 'Order status updated successfully', orderId, status };
  }

  async cancelOrder(userId: number, orderId: number, role?: string) {
    const orderRows = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (orderRows.length === 0 || (orderRows[0].userId !== userId && role !== 'admin')) {
      throw new NotFoundException('Order not found');
    }

    const order = orderRows[0];
    if (order.status === 'delivered' || order.status === 'rejected') {
      throw new Error('Cannot cancel a delivered or already rejected order');
    }

    // 1. Update order status to 'rejected' and isActive to false
    await db.update(orders)
      .set({ status: 'rejected', isActive: false })
      .where(eq(orders.id, orderId));

    // 2. Find items in the order
    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    // 3. Set the cart item activity status to false (0) for these products
    for (const item of items) {
      if (item.productId) {
        const existingCart = await db
          .select()
          .from(cart)
          .where(
            and(
              eq(cart.userId, order.userId),
              eq(cart.productId, item.productId)
            )
          )
          .limit(1);

        if (existingCart.length > 0) {
          await db.update(cart)
            .set({ isActive: false })
            .where(eq(cart.id, existingCart[0].id));
        } else {
          await db.insert(cart).values({
            userId: order.userId,
            productId: item.productId,
            quantity: item.quantity,
            isActive: false
          });
        }
      }
    }

    return { message: 'Order cancelled successfully', orderId };
  }
}
