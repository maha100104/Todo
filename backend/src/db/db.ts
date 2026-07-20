import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import * as fs from "fs";
import * as path from "path";

// Manually parse .env variables to avoid NestJS ConfigModule import race conditions
function loadEnv() {
  const possiblePaths = [
    path.resolve(__dirname, "../../.env"),
    path.resolve(__dirname, "../.env"),
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "src/.env")
  ];
  for (const envPath of possiblePaths) {
    if (fs.existsSync(envPath)) {
      try {
        const envConfig = fs.readFileSync(envPath, "utf8");
        envConfig.split("\n").forEach((line) => {
          const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
          if (match) {
            const key = match[1];
            let val = match[2] || "";
            if (val.length > 0 && val.startsWith('"') && val.endsWith('"')) {
              val = val.substring(1, val.length - 1);
            }
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        });
        break; // Stop after loading the first valid env file found
      } catch (err) {
        console.error(`Error reading env file at ${envPath}:`, err);
      }
    }
  }
}

loadEnv();

const isTiDB = (process.env.DB_HOST || "").includes("tidbcloud.com");

const connection = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || process.env.DB_USERNAME || "jwt_user",
    password: process.env.DB_PASSWORD || "Maha@123",
    database: process.env.DB_NAME || process.env.DB_DATABASE || "todo_db",
    ssl: isTiDB ? { minVersion: "TLSv1.2", rejectUnauthorized: true } : undefined,
});

export const db = drizzle(connection);