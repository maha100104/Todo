import { db } from "../src/db/db";
import { cart, products } from "../src/schema/user.schema";
import { eq, and } from "drizzle-orm";

async function main() {
  // Insert a test item in cart
  await db.insert(cart).values({
    userId: 4,
    productId: 1,
    quantity: 1,
    isActive: true
  });

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
    .limit(1);

  console.log("Drizzle Join Result:", JSON.stringify(items, null, 2));

  // Clean up
  await db.delete(cart).where(eq(cart.productId, 1));
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
