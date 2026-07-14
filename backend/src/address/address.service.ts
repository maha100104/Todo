import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { db } from '../db/db';
import { addresses } from '../schema/user.schema';
import { eq, and } from 'drizzle-orm';

@Injectable()
export class AddressService {

  async getAddresses(userId: number) {
    return db.select().from(addresses).where(eq(addresses.userId, userId));
  }

  async addAddress(userId: number, body: any) {
    const existing = await db.select().from(addresses).where(eq(addresses.userId, userId));
    if (existing.length >= 10) {
      throw new BadRequestException('Maximum 10 addresses allowed per user.');
    }

    const { fullName, phone, addressLine1, addressLine2, city, state, pincode, isDefault } = body;
    if (!fullName || !phone || !addressLine1 || !city || !state || !pincode) {
      throw new BadRequestException('Please fill in all required address fields.');
    }

    // If setting as default, clear existing default
    if (isDefault) {
      await db.update(addresses).set({ isDefault: 0 }).where(eq(addresses.userId, userId));
    }

    // If this is the first address, make it default automatically
    const makeDefault = isDefault || existing.length === 0 ? 1 : 0;

    await db.insert(addresses).values({
      userId, fullName, phone, addressLine1,
      addressLine2: addressLine2 || null,
      city, state, pincode,
      isDefault: makeDefault
    });

    return { message: 'Address added successfully' };
  }

  async updateAddress(userId: number, addressId: number, body: any) {
    const addr = await db.select().from(addresses)
      .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)))
      .limit(1);

    if (addr.length === 0) throw new NotFoundException('Address not found');

    const { fullName, phone, addressLine1, addressLine2, city, state, pincode, isDefault } = body;

    if (isDefault) {
      await db.update(addresses).set({ isDefault: 0 }).where(eq(addresses.userId, userId));
    }

    await db.update(addresses).set({
      fullName, phone, addressLine1,
      addressLine2: addressLine2 || null,
      city, state, pincode,
      isDefault: isDefault ? 1 : 0
    }).where(eq(addresses.id, addressId));

    return { message: 'Address updated successfully' };
  }

  async deleteAddress(userId: number, addressId: number) {
    const addr = await db.select().from(addresses)
      .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)))
      .limit(1);

    if (addr.length === 0) throw new NotFoundException('Address not found');

    await db.delete(addresses).where(eq(addresses.id, addressId));
    return { message: 'Address deleted successfully' };
  }

  async setDefault(userId: number, addressId: number) {
    const addr = await db.select().from(addresses)
      .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)))
      .limit(1);

    if (addr.length === 0) throw new NotFoundException('Address not found');

    await db.update(addresses).set({ isDefault: 0 }).where(eq(addresses.userId, userId));
    await db.update(addresses).set({ isDefault: 1 }).where(eq(addresses.id, addressId));
    return { message: 'Default address updated' };
  }
}
