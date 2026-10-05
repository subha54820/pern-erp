# 🚀 PERN Stack ERP Web Application — Fundsroom Case Study

A production-ready Enterprise Resource Planning (ERP) application implementing the full order fulfillment lifecycle:

$$\text{Customer Enquiry} \longrightarrow \text{Quotation} \longrightarrow \text{Sales Order} \longrightarrow \text{Inventory Reservation} \longrightarrow \text{Dispatch}$$

---

## 🌟 Tech Stack

- **Frontend**: React 19, Vite, Lucide Icons, Axios, Vanilla CSS (Modern dark glassmorphism theme)
- **Backend**: Node.js, Express.js REST APIs
- **Database**: PostgreSQL (`pg` pool) with native support for `pg-mem` in-memory fallback for instant zero-configuration testing & demos
- **Security**: JWT Authentication, `bcryptjs` password hashing, Role-Based Access Control (RBAC) middleware
- **Testing**: Jest + Supertest test suite verifying all critical business rules

---

## 👥 Role-Based Access Control (RBAC)

| Role | Permissions | Default Credentials |
|---|---|---|
| **Admin** (`ADMIN`) | Inventory management, Order confirmation, Stock reservation, Dispatch processing, View all audit records | `admin@fundsroom.com` / `admin123` |
| **Sales User** (`SALES`) | Customer onboarding, Enquiry creation, Quotation generation, Quotation acceptance/rejection, Convert accepted quotations to Sales Orders, View stock availability | `sales@fundsroom.com` / `sales123` |

---

## ⚙️ Core Business Rules & Guarantees

1. **Quotation to Order Conversion**: Only **ACCEPTED** quotations can be converted into Sales Orders.
2. **Duplicate Order Prevention**: A quotation can only be converted **once** into a Sales Order (1-to-1 relationship enforced).
3. **Stock Reservation Constraints**: Available stock is dynamically computed as:
   $$\text{Available Stock} = \text{Physical Stock} - \text{Reserved Stock}$$
   Orders cannot reserve more than the currently available stock.
4. **Physical Stock Deduction on Dispatch**:
   - Dispatching decreases both physical stock and reserved stock.
   - Prevents duplicate dispatches for the same order.
   - Updates Sales Order status to `DISPATCHED`.

---

## 🚀 Quick Start Guide

### 1. Zero-Setup Demo Mode (Instant, No Postgres Required)
The project is configured by default to use `pg-mem` in-memory database with auto-seeding.

```bash
# In one terminal: Start Backend
cd backend
npm run dev

# In a second terminal: Start Frontend
cd frontend
npm run dev
```
Open **http://localhost:5173** in your browser.

---

### 2. Production PostgreSQL Mode
If you prefer running against a local or remote PostgreSQL instance:

1. Create a database in PostgreSQL:
   ```sql
   CREATE DATABASE pern_erp;
   ```
2. Update `backend/.env`:
   ```env
   USE_PG_MEM=false
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_NAME=pern_erp
   PORT=5000
   JWT_SECRET=fundsroom_erp_secret_key
   ```
3. Run migrations and seed data:
   ```bash
   cd backend
   npm run seed
   npm run dev
   ```

---

## 🧪 Running Automated Tests

Run the complete integration and business-rule test suite:

```bash
cd backend
npm test
```

### Test Coverage:
- ✅ Authentication & JWT verification (Admin vs Sales user authorization)
- ✅ Quotation state enforcement (rejecting order creation from pending/rejected quotes)
- ✅ Prevention of duplicate sales orders from identical quotation ID
- ✅ Available stock calculations & reservation constraints
- ✅ Dispatch execution, stock deductions, and duplicate dispatch guard

---

## 📁 Project Structure

```
pern-stack-project/
├── backend/
│   ├── src/
│   │   ├── config/          # DB connection & pg-mem bridge
│   │   ├── controllers/     # Business logic for auth, enquiry, quotation, order, dispatch, inventory
│   │   ├── db/              # schema.sql and initDb.js seeder
│   │   ├── middleware/      # JWT auth and RBAC role middleware
│   │   ├── routes/          # Express REST API routes
│   │   ├── app.js           # Express application setup
│   │   └── server.js        # Server listener & bootstrap
│   ├── tests/
│   │   └── erp.test.js      # Comprehensive Jest integration tests
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx       # Interactive login with one-click test credentials
│   │   │   ├── EnquiriesPage.jsx   # Enquiry management with dynamic item rows
│   │   │   ├── QuotationsPage.jsx  # Quote creation, calculation & accept/reject/convert
│   │   │   └── OrdersPage.jsx      # Sales Orders, Inventory overview & Dispatch processing
│   │   ├── api.js           # Axios instance with JWT interceptors
│   │   ├── App.jsx          # Role-aware sidebar layout & views
│   │   └── index.css        # Premium Dark Glassmorphism Design System
│   ├── index.html
│   ├── vite.config.js       # Vite proxy configuration
│   └── package.json
└── README.md
```
