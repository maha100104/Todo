import { mysqlTable, int , varchar, text, timestamp, double, boolean } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
    id:int().autoincrement().primaryKey(),
    name:varchar("name",{length:100}).notNull(),
    email:varchar("email",{length:100}).notNull().unique(),
    password:varchar("password",{length:255}).notNull(),
    role:varchar("role",{length:50}).default("user").notNull(),
    createdAt:timestamp("createdAt").defaultNow().notNull()
});

export const logins = mysqlTable("logins", {
    id: int().primaryKey(),
    accessToken: text("access_token").notNull(),
    refreshToken: text("refresh_token").notNull(),
    loginAt:timestamp("login_At").defaultNow().notNull(),
    logOutAt:timestamp("logout_At").defaultNow().notNull()
});

export const products = mysqlTable("products", {
    id: int("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    price: double("price").notNull(),
    discountPercentage: double("discountPercentage").default(0),
    rating: double("rating").default(0),
    stock: int("stock").default(0),
    brand: varchar("brand", { length: 100 }),
    category: varchar("category", { length: 100 }).notNull(),
    thumbnail: text("thumbnail"),
    isActive: boolean("is_active").default(true).notNull(),
    offer: varchar("offer", { length: 255 })
});

export const wishlist = mysqlTable("wishlist", {
    id: int().autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    productId: int("productId").notNull().references(() => products.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt").defaultNow().notNull()
});

export const cart = mysqlTable("cart", {
    id: int().autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    productId: int("productId").notNull().references(() => products.id, { onDelete: "cascade" }),
    quantity: int("quantity").notNull().default(1),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});

export const addresses = mysqlTable("addresses", {
    id: int().autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    fullName: varchar("fullName", { length: 100 }).notNull(),
    phone: varchar("phone", { length: 15 }).notNull(),
    addressLine1: varchar("addressLine1", { length: 255 }).notNull(),
    addressLine2: varchar("addressLine2", { length: 255 }),
    city: varchar("city", { length: 100 }).notNull(),
    state: varchar("state", { length: 100 }).notNull(),
    pincode: varchar("pincode", { length: 10 }).notNull(),
    isDefault: int("isDefault").notNull().default(0),
    createdAt: timestamp("createdAt").defaultNow().notNull()
});

export const orders = mysqlTable("orders", {
    id: int().autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    addressId: int("addressId").references(() => addresses.id, { onDelete: "set null" }),
    totalAmount: double("totalAmount").notNull(),
    status: varchar("status", { length: 50 }).notNull().default("ordered"),
    isActive: boolean("is_active").notNull().default(true),
    txnId: varchar("txnId", { length: 100 }).notNull(),
    paymentMethod: varchar("paymentMethod", { length: 20 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});

export const orderItems = mysqlTable("order_items", {
    id: int().autoincrement().primaryKey(),
    orderId: int("orderId").notNull().references(() => orders.id, { onDelete: "cascade" }),
    productId: int("productId").references(() => products.id, { onDelete: "set null" }),
    quantity: int("quantity").notNull(),
    price: double("price").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    thumbnail: text("thumbnail")
});

export const orderStatuses = mysqlTable("order_statuses", {
    id: int().autoincrement().primaryKey(),
    key: varchar("key", { length: 50 }).notNull().unique(),
    label: varchar("label", { length: 100 }).notNull(),
    color: varchar("color", { length: 20 }).notNull(),
    isStep: boolean("is_step").notNull().default(false),
    stepOrder: int("step_order")
});

export const reviews = mysqlTable("reviews", {
    id: int().autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    productId: int("productId").notNull().references(() => products.id, { onDelete: "cascade" }),
    rating: int("rating").notNull(),
    comment: text("comment").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});