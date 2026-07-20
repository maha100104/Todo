# 🚀 TaskFlow - Modern Full-Stack Todo & Productivity Dashboard

TaskFlow is a high-performance, full-stack productivity web application built with **React + Vite**, **NestJS**, **Drizzle ORM**, and **MySQL**. It features an elegant UI with seamless Dark & Light theme switching, soft-deletion, real-time activity tracking, and comprehensive task analytics.

---

## ✨ Features

- **🔐 Authentication & User Security**:
  - JWT-based authentication with secure password hashing (`bcrypt`).
  - Interactive password visibility toggles (`FiEye` / `FiEyeOff`) on Login, Register, and Profile pages.
  - Logout confirmation modal to prevent accidental session termination.
- **🌓 Dark & Light Theme System**:
  - Persistent theme system backed by `ThemeContext` and `localStorage`.
  - Custom-tuned high-contrast Light Theme with dark slate typography and vibrant teal accents.
- **🗑️ Soft Delete Architecture**:
  - Tasks are safely preserved in the database using an `is_active` (`BOOLEAN`) flag.
  - Deleting a task triggers a confirmation modal, setting `is_active = false` without losing historical data.
- **📊 Interactive Dashboard & Task Management**:
  - **Dynamic Welcome Banner**: Displays live counts of overdue tasks and tasks due today.
  - **Progress Analytics**: Completion progress bar featuring percent and numeric ratios (e.g., `29% Completed (2/7)`).
  - **Overdue & Due Today Banners**: Intelligent card display restricted to 3 cards initially with an expandable "View All" toggle.
  - Full CRUD operations with priority levels (`high`, `medium`, `low`), categories (`work`, `personal`, `study`), and due dates.
- **📱 Fully Responsive Design**:
  - Carefully crafted layout with mobile-first responsiveness down to 320px screen width.

---

## 🛠️ Technology Stack

### **Frontend**
- **Framework**: React 19 + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 + Vanilla CSS Variables
- **Routing**: React Router v7
- **Icons**: React Icons (`react-icons/fi`)
- **Notifications**: React Hot Toast

### **Backend**
- **Framework**: NestJS
- **Database**: MySQL
- **ORM**: Drizzle ORM
- **Authentication**: Passport-JWT, Bcrypt
- **Validation**: Class-Validator & Class-Transformer

---

## 📁 Project Structure

```text
FullStackProject TODO/
├── backend/                  # NestJS Backend API
│   ├── src/
│   │   ├── auth/            # Auth module (JWT, Login, Register, Profile)
│   │   ├── db/              # Database initialization & Drizzle connection
│   │   ├── schema/          # Database table schemas (users, todos)
│   │   ├── todos/           # Todos module (Service, Controller, DTOs)
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── .env.example
│   └── package.json
│
├── frontend/                 # React + Vite Frontend App
│   ├── src/
│   │   ├── components/      # UI components (Navbar, TodoCard, Modals, Stats)
│   │   ├── context/         # AuthContext & ThemeContext
│   │   ├── pages/           # Dashboard, Login, Register, Profile
│   │   ├── services/        # Axios API instance
│   │   ├── types/           # TypeScript interfaces
│   │   ├── App.tsx
│   │   └── index.css        # CSS variables & Light/Dark Theme overrides
│   ├── index.html
│   └── package.json
│
├── package.json              # Monorepo root package.json
└── pnpm-workspace.yaml       # pnpm workspace configuration
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: `v18.x` or higher
- **Package Manager**: `pnpm` (or `npm` / `yarn`)
- **Database**: `MySQL Server`

---

### 2. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a `.env` file based on `.env.example`:
   ```env
   PORT=3000
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=todo_db
   JWT_SECRET=super_secret_jwt_key
   ```

3. Install dependencies:
   ```bash
   pnpm install
   ```

4. Initialize database schema:
   ```bash
   pnpm run db:init
   ```

5. Start the backend development server:
   ```bash
   pnpm run start:dev
   ```
   The backend server will start at `http://localhost:3000`.

---

### 3. Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Start the frontend development server:
   ```bash
   pnpm run dev
   ```
   The frontend application will start at `http://localhost:5173`.

---

## 📡 API Endpoints Summary

### **Authentication (`/auth`)**
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/auth/register` | Register a new user |
| `POST` | `/auth/login` | Login user & return JWT token |
| `GET` | `/auth/profile` | Get current user profile & account stats |
| `PATCH` | `/auth/profile` | Update profile information |
| `PATCH` | `/auth/change-password` | Change user password |

### **Todos (`/todos`)**
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/todos` | Get active todos (supports search & filters) |
| `POST` | `/todos` | Create a new todo (`isActive = true`) |
| `GET` | `/todos/:id` | Get specific todo by ID |
| `PATCH` | `/todos/:id` | Update todo details or status |
| `DELETE` | `/todos/:id` | Soft-delete todo (`is_active = false`) |

---

## 📝 License

This project is open source and available under the [MIT License](LICENSE).
