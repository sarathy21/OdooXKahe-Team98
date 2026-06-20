# Mini ERP System

A smart Mini Enterprise Resource Planning (ERP) system built with Next.js, TypeScript, Tailwind CSS, shadcn/ui, and Supabase. Designed for the national hackathon.

---

## Problem Statement

Small and medium enterprises struggle with fragmented tools for managing inventory, sales, procurement, and manufacturing. This leads to stockouts, delayed orders, and manual coordination overhead. Mini ERP solves this with an automated procurement engine that detects shortages from sales orders and triggers purchase or manufacturing orders automatically.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI Library | shadcn/ui |
| Backend / DB | Supabase (PostgreSQL) |
| Forms | React Hook Form |
| State Management | React Server Components + Client Components |

---

## Architecture

```
src/
├── app/               # Next.js App Router pages & API routes
├── components/        # Reusable UI components (shadcn/ui)
├── lib/               # Utility configs (Supabase client, helpers)
├── services/          # Data-access layer (Supabase queries)
└── types/             # TypeScript interfaces & type definitions
```

**Data flow:**
1. UI components call service functions
2. Service functions query Supabase via the typed client
3. Business logic (procurement engine) lives in `procurement.service.ts`
4. All database interactions are centralized in services — UI never touches Supabase directly

---

## Core Modules

### Product Management
- Create, update, and list products
- Track stock quantity, sales price, cost price
- Configure procurement strategy and procurement type (purchase / manufacture)

### Sales Orders
- Create sales orders against a product
- System automatically checks stock sufficiency
- If stock is sufficient → order processed
- If shortage detected → procurement engine triggers

### Purchase Orders
- Auto-created when procurement type is **Purchase**
- Track supplier, required quantity, and status
- Manual creation also supported

### Manufacturing Orders
- Auto-created when procurement type is **Manufacture**
- Track required quantity and status
- Supports make-to-order workflow

### Bills of Materials (BoM)
- Define raw materials and quantities needed for manufacturing a product
- Enables future MRP (Material Requirements Planning) expansion

### Procurement Engine
- **`checkStock(productId, quantity)`** — compares available stock against demand
- **`triggerProcurement(productId, shortage, type)`** — auto-creates Purchase Order or Manufacturing Order based on the product's procurement type
- Central business logic that ties Sales → Procurement → Fulfillment

---

## Database Schema

### products
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | TEXT | Product name |
| stock_qty | INTEGER | Current stock |
| sales_price | DECIMAL | Selling price |
| cost_price | DECIMAL | Cost price |
| procurement_strategy | TEXT | Strategy (e.g., "make_to_order", "buy") |
| procurement_type | TEXT | "purchase" or "manufacture" |
| created_at | TIMESTAMPTZ | Auto-generated |

### sales_orders
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| customer_name | TEXT | Customer name |
| product_id | UUID | FK → products.id |
| quantity | INTEGER | Ordered quantity |
| shortage | INTEGER | Unfulfilled quantity |
| status | TEXT | e.g., "draft", "confirmed", "fulfilled" |
| created_at | TIMESTAMPTZ | Auto-generated |

### purchase_orders
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| product_id | UUID | FK → products.id |
| required_qty | INTEGER | Quantity to purchase |
| supplier | TEXT | Supplier name |
| status | TEXT | e.g., "draft", "placed", "received" |
| created_at | TIMESTAMPTZ | Auto-generated |

### manufacturing_orders
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| product_id | UUID | FK → products.id |
| required_qty | INTEGER | Quantity to manufacture |
| status | TEXT | e.g., "draft", "in_progress", "completed" |
| created_at | TIMESTAMPTZ | Auto-generated |

### bill_of_materials
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| product_id | UUID | FK → products.id |
| raw_material | TEXT | Raw material name |
| quantity | INTEGER | Quantity required |

---

## Business Flow

```
1. Product Created
   ├── Defines stock_qty, procurement_strategy, procurement_type
   └── Cost & sales price set

2. Sales Order Created
   ├── Selects product & quantity
   └── System calls checkStock()

3. Stock Check
   ├── If stock_qty >= quantity
   │   └── Order fulfilled, stock decremented
   └── If stock_qty < quantity
       ├── Shortage = quantity - stock_qty
       └── triggerProcurement() called

4. Procurement Decision
   ├── procurement_type = "purchase"
   │   └── Purchase Order auto-created (status: draft)
   └── procurement_type = "manufacture"
       └── Manufacturing Order auto-created (status: draft)

5. Procurement Fulfilled
   ├── Stock updated (+received_qty or +manufactured_qty)
   └── Original Sales Order status updated to "fulfilled"
```

---

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your Supabase URL and anon key

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Team Responsibilities

| Module | Focus |
|--------|-------|
| Product Management | Product CRUD, stock tracking, pricing |
| Sales Module | Sales order creation, stock validation, procurement trigger |
| Procurement Engine | Stock checking, auto-order creation, linkage |
| Purchase Orders | PO creation, supplier mgmt, order receiving |
| Manufacturing | MO creation, production tracking, BoM |
| UI / Frontend | shadcn/ui components, forms, data tables, dashboards |

---

## Pending Tasks

- [ ] UI pages for each module (products, sales, purchases, manufacturing)
- [ ] API routes for client-side interactions
- [ ] Authentication (Supabase Auth)
- [ ] Procurement fulfillment logic (stock update on receive/complete)
- [ ] Dashboard with KPIs (stock levels, pending orders)
- [ ] BoM management UI and MRP calculation
- [ ] Form validation with React Hook Form + Zod
- [ ] Database migrations / seed data
