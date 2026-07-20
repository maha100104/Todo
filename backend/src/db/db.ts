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

const host = process.env.DB_HOST || "gateway01.ap-southeast-1.prod.aws.tidbcloud.com";
const port = Number(process.env.DB_PORT) || 4000;
const user = process.env.DB_USER || process.env.DB_USERNAME || "4CtC8eCaW5a8oJx.root";
const password = process.env.DB_PASSWORD || "0jhpujOpepBfnFTQ";
const database = process.env.DB_NAME || process.env.DB_DATABASE || "todo_db";

const isTiDB = host.includes("tidbcloud.com");

const connection = mysql.createPool({
    host,
    port,
    user,
    password,
    database,
    ssl: isTiDB ? { rejectUnauthorized: true } : undefined,
});

export const db = drizzle(connection);