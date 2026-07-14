import { db } from "../src/db/db";
import { users } from "../src/schema/user.schema";

async function main() {
  const allUsers = await db.select().from(users);
  console.log("Users in DB:", JSON.stringify(allUsers, null, 2));
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
