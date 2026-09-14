# AGENTS.md — ChiyaPasal POS System Guide for AI Agents

> **Context for AI Agents**: This document provides essential architecture patterns, domain models, database rules, file locations, conventions, and operational gotchas for the **ChiyaPasal POS & Management System**. Read this file before proposing or executing code changes.

---

## 1. Project Overview & Domain Context

**ChiyaPasal** is an all-in-one, multi-tenant Cafe, Tea Shop, and Restaurant POS & Management Platform tailored for the Nepalese hospitality industry. It is designed as an end-to-end operational operating system, not just a simple billing app.

### Core Workflow Lifecycle
```
Customer / Table Selection 
   ➔ Order Creation (Dine-in / Takeaway / Delivery) 
   ➔ Kitchen Order Ticket (KOT dispatched to Kitchen Display) 
   ➔ Food Preparation & Item Status Updates 
   ➔ Billing & Invoice Generation 
   ➔ Payment Settlement (Cash, Fonepay/QR, Split, or Customer Khata Credit) 
   ➔ Automatic Inventory Deduction (Recipe BOM mapping) 
   ➔ Customer Loyalty Points Calculation 
   ➔ Real-time Sales Analytics & Daily Reports
```

---

## 2. Monorepo Layout

The repository is structured as an npm workspaces monorepo:

```
chhiyapasal/
├── apps/
│   ├── api/                     # Express.js + TypeORM + PostgreSQL Backend
│   │   ├── src/
│   │   │   ├── aliases.ts       # Programmatic module-alias registration for production dist
│   │   │   ├── config/env.ts    # Zod environment validation schema & env export
│   │   │   ├── logger.ts        # Winston logger instance (console + file logs)
│   │   │   ├── main.ts          # Server entry, graceful shutdown, migration runner
│   │   │   ├── app.ts           # Express app setup, security headers, rate limits, routes
│   │   │   ├── database/        # TypeORM DataSource, migrations, and seed scripts
│   │   │   │   ├── data-source.ts
│   │   │   │   ├── migrations/
│   │   │   │   └── seeds/
│   │   │   ├── entities/        # TypeORM entities (30+ domain models)
│   │   │   ├── middleware/      # Auth, Tenant, Authorization (RBAC), Validate, Error
│   │   │   ├── modules/         # 23 domain feature modules (Controller-Service-Route)
│   │   │   └── shared/          # Errors, constants, permissions, response utilities
│   │   └── tsconfig.json
│   └── web/                     # React 18 + Vite + Tailwind CSS Frontend
│       ├── src/
│       │   ├── api/client.ts    # Axios instance with auth & branch headers
│       │   ├── store/           # Zustand stores: auth.store.ts, pos.store.ts
│       │   ├── components/      # Sidebar, modals, reusable UI
│       │   └── pages/           # POS, Orders, Kitchen, Tables, Employees, Khata, etc.
│       └── vite.config.ts       # Vite chunk splitting & proxy config
├── packages/
│   └── shared-types/            # Shared TypeScript enums and interfaces
├── ecosystem.config.js          # PM2 production process configuration
├── .env                         # Root dev environment variables
├── .env.production.example      # Template for production deployment
├── logs/                        # PM2 & Winston production logs
└── package.json                 # Monorepo scripts (dev, build, start, migrations)
```

---

## 3. Database Architecture & Multi-Tenancy

### Multi-Tenancy Rules
- Every business has a unique `business_id` (UUID).
- Data is partitioned by `business_id`.
- Branches belong to a business (`branch_id`).
- All requests requiring tenant context pass through `authenticate` and `requireTenant` middleware.
- `req.businessId` and `req.branchId` are extracted from the verified JWT payload or the `x-branch-id` HTTP header.
- **Rule for AI Agents**: Always scope entity queries with `business_id = req.businessId` (and optionally `branch_id = req.branchId` where applicable). Never write queries without tenant isolation.

### Key Database Entities

| Entity | Table | Responsibility |
|---|---|---|
| `Business` | `businesses` | Tenant account, name, currency (default `NPR`), timezone (`Asia/Kathmandu`) |
| `Branch` | `branches` | Multi-branch locations under a business |
| `Role` | `roles` | RBAC roles (`OWNER`, `BRANCH_MANAGER`, `CASHIER`, `WAITER`, `KITCHEN_STAFF`) |
| `User` | `users` | Staff credentials (`password_hash`, `pin_hash`), role and branch assignment |
| `TableArea` | `table_areas` | Physical sections (e.g. Indoor, Rooftop, Garden) |
| `Table` | `tables` | Tables with status (`AVAILABLE`, `OCCUPIED`, `RESERVED`, `CLEANING`) |
| `Category` | `categories` | Menu categories (Hot Drinks, Bakery, Khaja, Momo, etc.) |
| `Product` | `products` | Menu items with price, tax rate, cost price, and stock tracking flag |
| `Recipe` / `RecipeItem` | `recipes`, `recipe_items` | Bill of Materials (BOM) linking a menu item to inventory ingredients |
| `InventoryItem` | `inventory_items` | Raw ingredients (Milk, Tea Leaves, Sugar, Flour) with unit and reorder level |
| `InventoryTransaction` | `inventory_transactions` | Stock in/out/wastage/recipe deduction audit log |
| `Order` / `OrderItem` | `orders`, `order_items` | Customer tickets (Dine-in, Takeaway, Delivery) with status history |
| `Kot` / `KotItem` | `kots`, `kot_items` | Kitchen tickets dispatched to kitchen display |
| `Invoice` | `invoices` | Tax invoices, discounts, subtotal, tax, and paid status |
| `Payment` | `payments` | Payments (Cash, QR/Fonepay, Card, Credit/Khata) with split payment support |
| `Customer` | `customers` | Customers, contact info, loyalty points |
| `CreditAccount` / `CreditTransaction` | `credit_accounts`, `credit_transactions` | Udharo / Khata customer ledger balance and settlement records |
| `Supplier` / `Purchase` / `Expense` | `suppliers`, `purchases`, `expenses` | Procurement, vendor bills, and operational expense tracking |

---

## 4. Authentication & Authorization

### Dual Authentication Modes
1. **Web Admin & Manager Login**:
   - Endpoint: `POST /api/v1/auth/login`
   - Input: `{ email, password }`
   - Used by Owners, Managers, and System Admins.
2. **Floor Staff Touch-Screen PIN Login**:
   - Endpoint: `POST /api/v1/auth/login-pin`
   - Input: `{ pin: "1111", branchId?: "...", employeeId?: "..." }`
   - Used by Cashiers, Waiters, and Kitchen staff on POS terminals.
   - The PIN is verified against `users.pin_hash` (stored with `bcrypt`).
   - Supports direct 4-to-6 digit entry or tapping an avatar + PIN.
3. **Public Branch Staff Directory**:
   - Endpoint: `GET /api/v1/auth/branch-staff`
   - Returns active staff at a branch (`id`, `name`, `role`, `hasPin`) for the touch screen staff picker.

### Default Seeded Credentials
- **Owner**: `admin@chhiyapasal.np` / `admin123` | **PIN**: `0000`
- **Cashier**: `cashier@chhiyapasal.np` / `admin123` | **PIN**: `1111`
- **Kitchen**: `kitchen@chhiyapasal.np` / `admin123` | **PIN**: `2222`
- **Waiter**: `waiter@chhiyapasal.np` / `admin123` | **PIN**: `3333`

---

## 5. Critical Technical Rules & Gotchas for AI Agents

### Rule 1: TypeORM `synchronize: false`
- Never set `synchronize: true` in `data-source.ts`. Schema synchronization is strictly disabled to protect production data.
- When changing an entity, **always** generate or create a TypeORM migration:
  ```powershell
  # To generate migration from entity diff:
  npm run migration:generate -- src/database/migrations/<MigrationName> --workspace=apps/api
  # To apply pending migrations:
  npm run migration:run --workspace=apps/api
  ```

### Rule 2: Path Aliases in Compiled JS (`src/aliases.ts`)
- The API uses path aliases (`@modules/*`, `@entities/*`, `@database/*`, etc.).
- In development, `tsconfig-paths` handles this dynamically via `ts-node-dev`.
- In production compiled JavaScript (`dist/`), `apps/api/src/aliases.ts` programmatically registers aliases using `path.resolve(__dirname, ...)`.
- **Any new entry point or script** in `apps/api` must import `./aliases` (or require `aliases.js`) before importing `@`-aliased modules.

### Rule 3: Operating System & Windows Environment
- The host environment is **Windows with PowerShell**.
- In PowerShell inline scripts, `$1`, `$2`, etc. are expanded by the shell unless escaped (`\$1`, `\$2`). Prefer writing temporary Node.js scripts or parameterized queries inside `.ts` files rather than complex inline PowerShell eval strings.
- Never run bare `cd` commands (use the `Cwd` parameter of the command runner).

### Rule 4: Frontend State Management (Zustand)
- `apps/web/src/store/auth.store.ts`: Manages `user`, `token`, `branchId`, `setAuth`, `logout`.
- `apps/web/src/store/pos.store.ts`: Manages active POS order type (`DINE_IN`, `TAKEAWAY`, `DELIVERY`), `selectedTableId`, `selectedCustomerId`, and `cart` items (`addItem`, `updateQuantity`, `removeItem`, `clearCart`).
- The API client (`apps/web/src/api/client.ts`) attaches `Authorization: Bearer <token>` and `x-branch-id: <branchId>` automatically on all requests.

### Rule 5: Production Logging & Error Handling
- Use `logger.info`, `logger.warn`, `logger.error` from `@config/../logger` (`apps/api/src/logger.ts`). Do not use raw `console.log` in backend services.
- Errors thrown in services should inherit from `AppError` (`NotFoundError`, `BadRequestError`, `UnauthorizedError`, `ConflictError`, `ForbiddenError`).
- The global error handler in `middleware/error-handler.ts` will catch them and respond with standard JSON format `{ success: false, message: string, details?: any }`.

---

## 6. Monorepo Scripts Reference

| Command | Working Dir | Action |
|---|---|---|
| `npm run dev` | root | Runs both API (`localhost:4000`) and Vite web app (`localhost:5173`) concurrently |
| `npm run build` | root | Compiles both API (`tsc`) and Web (`tsc && vite build`) with 0 errors |
| `npm run build:api` | root | Compiles backend to `apps/api/dist` |
| `npm run build:web` | root | Compiles frontend to `apps/web/dist` |
| `npm run start` | root | Starts production backend using PM2 (`ecosystem.config.js`) |
| `npm run stop` | root | Stops PM2 process |
| `npm run logs` | root | Streams PM2 output and error logs |
| `npm run migration:run` | root | Executes all pending TypeORM migrations |
| `npm run migration:revert` | root | Reverts the last executed migration |
| `npm run seed` | root | Re-seeds default business, roles, users, and menu items |

---

## 7. How to Add New Features (Workflow Checklist)

When an AI agent is instructed to add a new feature (e.g. loyalty discounts, barcode scanners, stock alerts):

1. **Entities**: Define or modify models in `apps/api/src/entities/`.
2. **Migrations**: Create a migration in `apps/api/src/database/migrations/` and run `npm run migration:run`.
3. **Module**: Implement routes, controller, and service in `apps/api/src/modules/<feature>/`.
4. **App Mount**: Register the route in `apps/api/src/app.ts` under `/api/v1/<feature>`.
5. **Permissions**: If role-based, add constants in `src/shared/constants/permissions.ts`.
6. **Frontend Store/API**: Add API calls in `apps/web/src/api/` and Zustand store actions if stateful.
7. **Frontend Page/Component**: Add page in `apps/web/src/pages/` and navigation in `Sidebar.tsx` & `App.tsx`.
8. **Build Verification**: Run `npm run build` to verify clean TypeScript compilation before completing.
