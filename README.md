# 🛒 E-Commerce Full Stack Application

A modern, responsive Full Stack E-Commerce application built with **React, TypeScript, NestJS, Drizzle ORM, MySQL, and JWT Authentication**.

The application provides a complete shopping experience with role-based access control, product management, cart, wishlist, orders, profile management, and an admin dashboard.

---

## 🚀 Features

### 🔐 Authentication & Authorization
- **User Registration & Login** with secure authentication.
- **JWT Authorization** with automated Token Refresh:
  - Access Token expires in **1 hour**.
  - Refresh Token expires in **7 days**.
- **Axios-Powered HTTP Pipeline** with custom Fetch-interface proxying.
- **Role-Based Access Control** (Admin / User roles).
- **Protected Routes & Guards** on both frontend and backend.
- **403 Unauthorized** access fallback page.
- **Secure Password Hashing** (bcrypt) & Password edit with old password validation.

---

### 👤 User Features
- **Product Catalog** with dynamic categories, pricing, ratings, and pagination.
- **Star Ratings System** with interactive filled yellow-colored stars.
- **E-Commerce Cart** with increment, decrement, total sum calculations, checkout, and simulated payment.
- **Wishlist** for pinning favorite items.
- **Order Flow**: Place orders, track history, view real-time status trackers.
- **Saved Address Profiles**: Add, edit, delete, and designate default billing/shipping address.
- **User Profiles**: Custom name, email, credentials, and password manager.

---

### ⭐ Product Reviews
- **Write Reviews**: Enabled for customers once their order status is changed to **Delivered**.
- **Interactive Stars**: Yellow star-based rating interface with a textarea field.
- **Review CRUD**: Users can add, edit, or delete their review comments.
- **Public Visibility**: Reviews are stored in the database and visible to all visiting users on the product details page.

---

### 🛠 Admin Features
- **Manage Products**: Add, edit, delete, and toggle activation status of catalog products.
- **Manage Users**:
  - Live table listing all registered users, email ids, registered dates, last used/login dates, and total orders placed.
  - Newly created users are automatically listed at the top.
  - Dynamic **database-level search**, role filtering, and sorting options.
- **Manage Orders**: View and update order statuses globally.

---

## 💻 Tech Stack

### Frontend
- **Framework**: React (Vite)
- **Language**: TypeScript
- **HTTP Client**: Axios (monkey-patched globally as transparent `window.fetch` adapter)
- **State Management**: Context API
- **Styling**: Vanilla CSS & Tailwind CSS
- **Routing**: React Router DOM

### Backend
- **Framework**: NestJS
- **Language**: TypeScript
- **Database ORM**: Drizzle ORM
- **Authentication**: JWT, passport-jwt
- **Hashing**: bcrypt

### Database
- **Engine**: MySQL

---

## 📂 Project Structure

### Frontend
```text
src/
├── assets/         # CSS styles and theme declarations
├── components/     # Reusable layout and navigation components (StoreLayout, etc.)
├── context/        # Global states (AuthContext, StoreContext)
├── pages/          # Application views (Login, Profile, Orders, AdminProducts, AdminUsers, etc.)
├── utils/          # Global helper tools (Toast alerts, etc.)
├── App.tsx         # Main route manager
└── main.tsx        # Render mount point
```

### Backend
```text
src/
├── auth/           # Login, registration, token refresh, profiles, and password handlers
├── cart/           # Shopping cart operations
├── orders/         # Ordering lifecycle and checkout handler
├── products/       # Products catalog CRUD operations
├── reviews/        # Review submissions and product comments
├── wishlist/       # Favorite lists
├── db/             # Drizzle instance initializer
├── schema/         # Drizzle schema definitions (user, products, orders, cart, etc.)
├── guard/          # Auth and role security guards
└── main.ts         # NestJS boostrapper
```

---

## 🔒 Authentication Flow
1. User registers or logs in; credentials are encrypted/verified via bcrypt.
2. A short-lived **Access Token (1 hr)** and a long-lived **Refresh Token (7 days)** are returned.
3. Access tokens are automatically appended as `Bearer` headers on protected requests.
4. If a request returns a `401 Unauthorized` response, the Axios wrapper intercepts the request, hits the `/auth/refresh` endpoint to acquire new credentials, and retries the original request seamlessly.

---

## 🗄 Database Modules
- **Users**: Admin/user credentials.
- **Logins**: Logs user login timestamp for auditing/last used tracking.
- **Products**: Detailed descriptions, pricing, active status, images.
- **Wishlist**: Saved catalog indices.
- **Cart**: Active shopping sessions.
- **Orders & Order Items**: Purchased records and line items.
- **Addresses**: Multi-address entries per customer profile.
- **Reviews**: Product rating indices and comments.

---

## 🚀 Installation

### Clone Repository
```bash
git clone https://github.com/yourusername/ecommerce-fullstack.git
cd ecommerce-fullstack
```

---

### Frontend Setup
```bash
cd frontend
pnpm install
pnpm run dev
```

---

### Backend Setup
```bash
cd backend
pnpm install
pnpm run start:dev
```

---

## ⚙ Environment Variables

Backend `.env`
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=jwt_user
DB_PASSWORD=Maha@123
DB_NAME=jwt_auth
JWT_SECRET=fallbackSecretKeyForDev
```

---

## 👨‍💻 Author

**Mahalakshmi P**  
*Associate Software Engineer*  

