import mysql from "mysql2/promise";
import * as fs from "fs";
import * as path from "path";

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
        break;
      } catch (err) {
        console.error(`Error reading env file at ${envPath}:`, err);
      }
    }
  }
}

loadEnv();

async function initDb() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "jwt_user",
    password: process.env.DB_PASSWORD || "Maha@123",
  });

  const dbName = process.env.DB_NAME || "todo_db";

  console.log(`Connecting to MySQL and ensuring database '${dbName}' exists...`);
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
  await connection.query(`USE \`${dbName}\`;`);

  console.log("Creating tables for Todo Application (including is_active)...");

  await connection.query(`SET FOREIGN_KEY_CHECKS = 0;`);
  
  await connection.query(`
    CREATE TABLE IF NOT EXISTS \`users\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`name\` VARCHAR(255) NOT NULL,
      \`email\` VARCHAR(255) NOT NULL UNIQUE,
      \`password\` TEXT NOT NULL,
      \`phone_number\` VARCHAR(50),
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS \`todos\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`user_id\` INT NOT NULL,
      \`title\` VARCHAR(255) NOT NULL,
      \`description\` TEXT,
      \`status\` ENUM('pending', 'in_progress', 'completed') NOT NULL DEFAULT 'pending',
      \`priority\` ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
      \`category\` ENUM('personal', 'work', 'study') NOT NULL DEFAULT 'personal',
      \`due_date\` VARCHAR(50),
      \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
    );
  `);

  try {
    await connection.query(`ALTER TABLE \`todos\` ADD COLUMN \`is_active\` TINYINT(1) NOT NULL DEFAULT 1;`);
  } catch (e) {}

  await connection.query(`SET FOREIGN_KEY_CHECKS = 1;`);

  console.log(`✅ Dedicated database '${dbName}' updated with is_active column successfully!`);
  await connection.end();
}

initDb().catch((err) => {
  console.error("❌ Database initialization error:", err);
  process.exit(1);
});
