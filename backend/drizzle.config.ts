import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "mysql",
  schema: "./src/schema/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "jwt_user",
    password: process.env.DB_PASSWORD || "Maha@123",
    database: process.env.DB_NAME || "todo_db",
  },
});
