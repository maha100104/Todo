import { db } from "../src/db/db";
import { users } from "../src/schema/user.schema";
import { eq } from "drizzle-orm";
import * as bcrypt from "bcrypt";

async function main() {
  const email = "maha100104@gmail.com";
  const rawPassword = "AdminPassword123";
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (existing.length > 0) {
    await db.update(users)
      .set({
        password: hashedPassword,
        role: "admin",
        name: "Admin"
      })
      .where(eq(users.email, email));
    console.log(`Admin user '${email}' password reset successfully to: ${rawPassword}`);
  } else {
    await db.insert(users).values({
      name: "Admin",
      email: email,
      password: hashedPassword,
      role: "admin"
    });
    console.log(`Admin user '${email}' created successfully with password: ${rawPassword}`);
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
