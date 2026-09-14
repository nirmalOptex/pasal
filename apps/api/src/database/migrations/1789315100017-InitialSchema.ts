import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1789315100017 implements MigrationInterface {
  name = 'InitialSchema1789315100017';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable pgcrypto for gen_random_uuid() — works on Render, Neon, AWS RDS, and local PostgreSQL
    // without requiring superuser privileges (unlike uuid-ossp)
    try {
      await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
    } catch {
      // Already enabled or insufficient privileges — gen_random_uuid() is built-in on PG 13+
    }
    await queryRunner.query(`CREATE TYPE public.branches_status_enum AS ENUM (
    'ACTIVE',
    'INACTIVE'
)`);
    await queryRunner.query(`CREATE TYPE public.credit_transactions_type_enum AS ENUM (
    'DEBIT',
    'CREDIT'
)`);
    await queryRunner.query(`CREATE TYPE public.inventory_transactions_type_enum AS ENUM (
    'PURCHASE',
    'SALE',
    'ADJUSTMENT',
    'WASTAGE',
    'RETURN'
)`);
    await queryRunner.query(`CREATE TYPE public.invoices_status_enum AS ENUM (
    'DRAFT',
    'ISSUED',
    'PARTIAL',
    'PAID',
    'CANCELLED',
    'REFUNDED'
)`);
    await queryRunner.query(`CREATE TYPE public.kot_items_status_enum AS ENUM (
    'NEW',
    'PREPARING',
    'READY',
    'SERVED'
)`);
    await queryRunner.query(`CREATE TYPE public.kots_status_enum AS ENUM (
    'NEW',
    'PREPARING',
    'READY',
    'SERVED'
)`);
    await queryRunner.query(`CREATE TYPE public.loyalty_transactions_type_enum AS ENUM (
    'EARN',
    'REDEEM',
    'ADJUST'
)`);
    await queryRunner.query(`CREATE TYPE public.order_items_status_enum AS ENUM (
    'PENDING',
    'PREPARING',
    'READY',
    'SERVED',
    'CANCELLED'
)`);
    await queryRunner.query(`CREATE TYPE public.orders_order_type_enum AS ENUM (
    'DINE_IN',
    'TAKEAWAY',
    'DELIVERY'
)`);
    await queryRunner.query(`CREATE TYPE public.orders_status_enum AS ENUM (
    'PENDING',
    'CONFIRMED',
    'PREPARING',
    'READY',
    'SERVED',
    'COMPLETED',
    'CANCELLED'
)`);
    await queryRunner.query(`CREATE TYPE public.payments_payment_method_enum AS ENUM (
    'CASH',
    'QR',
    'CARD',
    'CREDIT'
)`);
    await queryRunner.query(`CREATE TYPE public.purchases_payment_status_enum AS ENUM (
    'UNPAID',
    'PARTIAL',
    'PAID'
)`);
    await queryRunner.query(`CREATE TYPE public.tables_status_enum AS ENUM (
    'AVAILABLE',
    'OCCUPIED',
    'RESERVED',
    'CLEANING'
)`);
    await queryRunner.query(`CREATE TABLE public.branches (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    address text,
    phone character varying(20),
    status public.branches_status_enum DEFAULT 'ACTIVE'::public.branches_status_enum NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
)`);
    await queryRunner.query(`CREATE TABLE public.businesses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    address text,
    phone character varying(20),
    email character varying(255),
    logo_url text,
    currency character varying(10) DEFAULT 'NPR'::character varying NOT NULL,
    timezone character varying(50) DEFAULT 'Asia/Kathmandu'::character varying NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
)`);
    await queryRunner.query(`CREATE TABLE public.categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    image_url text,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
)`);
    await queryRunner.query(`CREATE TABLE public.credit_accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    balance numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    credit_limit numeric(12,2),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
)`);
    await queryRunner.query(`CREATE TABLE public.credit_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    credit_account_id uuid NOT NULL,
    invoice_id uuid,
    type public.credit_transactions_type_enum NOT NULL,
    amount numeric(12,2) NOT NULL,
    balance_after numeric(12,2) NOT NULL,
    notes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
)`);
    await queryRunner.query(`CREATE TABLE public.customers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    phone character varying(20),
    email character varying(255),
    loyalty_points integer DEFAULT 0 NOT NULL,
    credit_balance numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
)`);
    await queryRunner.query(`CREATE TABLE public.expense_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid,
    name character varying(100) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
)`);
    await queryRunner.query(`CREATE TABLE public.expenses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    branch_id uuid NOT NULL,
    category_id uuid,
    amount numeric(12,2) NOT NULL,
    description text,
    vendor character varying(255),
    expense_date date NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
)`);
    await queryRunner.query(`CREATE TABLE public.inventory_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    unit character varying(50) NOT NULL,
    current_stock numeric(12,3) DEFAULT '0'::numeric NOT NULL,
    low_stock_threshold numeric(12,3) DEFAULT '0'::numeric NOT NULL,
    cost_per_unit numeric(12,2),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
)`);
    await queryRunner.query(`CREATE TABLE public.inventory_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    branch_id uuid NOT NULL,
    inventory_item_id uuid NOT NULL,
    type public.inventory_transactions_type_enum NOT NULL,
    quantity numeric(12,3) NOT NULL,
    balance_after numeric(12,3) NOT NULL,
    reference_id uuid,
    reference_type character varying(50),
    notes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
)`);
    await queryRunner.query(`CREATE TABLE public.invoices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    branch_id uuid NOT NULL,
    order_id uuid NOT NULL,
    invoice_number character varying(50) NOT NULL,
    customer_id uuid,
    subtotal numeric(12,2) NOT NULL,
    discount_amount numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    tax_amount numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    total_amount numeric(12,2) NOT NULL,
    paid_amount numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    due_amount numeric(12,2) NOT NULL,
    status public.invoices_status_enum DEFAULT 'DRAFT'::public.invoices_status_enum NOT NULL,
    cancelled_at timestamp with time zone,
    cancelled_by uuid,
    cancel_reason text,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
)`);
    await queryRunner.query(`CREATE TABLE public.kot_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    kot_id uuid NOT NULL,
    order_item_id uuid NOT NULL,
    product_name character varying(255) NOT NULL,
    quantity integer NOT NULL,
    notes text,
    status public.kot_items_status_enum DEFAULT 'NEW'::public.kot_items_status_enum NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
)`);
    await queryRunner.query(`CREATE TABLE public.kots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    branch_id uuid NOT NULL,
    order_id uuid NOT NULL,
    kot_number character varying(50) NOT NULL,
    status public.kots_status_enum DEFAULT 'NEW'::public.kots_status_enum NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
)`);
    await queryRunner.query(`CREATE TABLE public.loyalty_rules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    spend_amount numeric(12,2) DEFAULT '100'::numeric NOT NULL,
    points_earned integer DEFAULT 1 NOT NULL,
    point_redemption_value numeric(12,2) DEFAULT '1'::numeric NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
)`);
    await queryRunner.query(`CREATE TABLE public.loyalty_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    order_id uuid,
    type public.loyalty_transactions_type_enum NOT NULL,
    points integer NOT NULL,
    balance_after integer NOT NULL,
    notes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
)`);
    await queryRunner.query(`CREATE TABLE public.order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    product_id uuid NOT NULL,
    product_name character varying(255) NOT NULL,
    product_price numeric(12,2) NOT NULL,
    quantity integer NOT NULL,
    unit_price numeric(12,2) NOT NULL,
    discount_amount numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    tax_amount numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    total_price numeric(12,2) NOT NULL,
    notes text,
    status public.order_items_status_enum DEFAULT 'PENDING'::public.order_items_status_enum NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
)`);
    await queryRunner.query(`CREATE TABLE public.order_status_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    from_status character varying(50),
    to_status character varying(50) NOT NULL,
    changed_by uuid,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
)`);
    await queryRunner.query(`CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    branch_id uuid NOT NULL,
    order_number character varying(50) NOT NULL,
    order_type public.orders_order_type_enum DEFAULT 'DINE_IN'::public.orders_order_type_enum NOT NULL,
    status public.orders_status_enum DEFAULT 'PENDING'::public.orders_status_enum NOT NULL,
    customer_id uuid,
    customer_name character varying(255),
    table_id uuid,
    token_number integer,
    delivery_address text,
    subtotal numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    discount_amount numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    tax_amount numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    total_amount numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    notes text,
    created_by uuid NOT NULL,
    updated_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
)`);
    await queryRunner.query(`CREATE TABLE public.payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    branch_id uuid NOT NULL,
    invoice_id uuid NOT NULL,
    payment_method public.payments_payment_method_enum NOT NULL,
    amount numeric(12,2) NOT NULL,
    reference_number character varying(100),
    notes text,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
)`);
    await queryRunner.query(`CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    category_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    price numeric(12,2) NOT NULL,
    image_url text,
    tax_rate numeric(5,2) DEFAULT '0'::numeric NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    is_available boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
)`);
    await queryRunner.query(`CREATE TABLE public.purchase_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    purchase_id uuid NOT NULL,
    inventory_item_id uuid NOT NULL,
    quantity numeric(12,3) NOT NULL,
    unit_cost numeric(12,2) NOT NULL,
    total_cost numeric(12,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
)`);
    await queryRunner.query(`CREATE TABLE public.purchases (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    branch_id uuid NOT NULL,
    supplier_id uuid NOT NULL,
    purchase_date date NOT NULL,
    invoice_number character varying(100),
    subtotal numeric(12,2) NOT NULL,
    tax_amount numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    total_amount numeric(12,2) NOT NULL,
    paid_amount numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    payment_status public.purchases_payment_status_enum DEFAULT 'UNPAID'::public.purchases_payment_status_enum NOT NULL,
    notes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
)`);
    await queryRunner.query(`CREATE TABLE public.recipe_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    recipe_id uuid NOT NULL,
    inventory_item_id uuid NOT NULL,
    quantity numeric(12,3) NOT NULL,
    unit character varying(50),
    created_at timestamp with time zone DEFAULT now() NOT NULL
)`);
    await queryRunner.query(`CREATE TABLE public.recipes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    name character varying(255),
    yield_quantity numeric(10,3) DEFAULT '1'::numeric NOT NULL,
    notes text,
    version integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
)`);
    await queryRunner.query(`CREATE TABLE public.refresh_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token_hash text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    revoked_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
)`);
    await queryRunner.query(`CREATE TABLE public.refunds (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    invoice_id uuid NOT NULL,
    payment_id uuid NOT NULL,
    amount numeric(12,2) NOT NULL,
    reason text,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
)`);
    await queryRunner.query(`CREATE TABLE public.roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    permissions jsonb DEFAULT '[]'::jsonb NOT NULL,
    is_system boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
)`);
    await queryRunner.query(`CREATE TABLE public.suppliers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    phone character varying(20),
    email character varying(255),
    address text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
)`);
    await queryRunner.query(`CREATE TABLE public.table_areas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    branch_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
)`);
    await queryRunner.query(`CREATE TABLE public.tables (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    branch_id uuid NOT NULL,
    table_area_id uuid NOT NULL,
    name character varying(50) NOT NULL,
    capacity integer DEFAULT 4 NOT NULL,
    status public.tables_status_enum DEFAULT 'AVAILABLE'::public.tables_status_enum NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
)`);
    await queryRunner.query(`CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    branch_id uuid,
    role_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(20),
    password_hash text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    last_login_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    pin_hash character varying(255)
)`);
    await queryRunner.query(`ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "PK_005269d8574e6fac0493715c308" PRIMARY KEY (id)`);
    await queryRunner.query(`ALTER TABLE ONLY public.products
    ADD CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY (id)`);
    await queryRunner.query(`ALTER TABLE ONLY public.customers
    ADD CONSTRAINT "PK_133ec679a801fab5e070f73d3ea" PRIMARY KEY (id)`);
    await queryRunner.query(`ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY (id)`);
    await queryRunner.query(`ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT "PK_1d55032f37a34c6eceacbbca6b8" PRIMARY KEY (id)`);
    await queryRunner.query(`ALTER TABLE ONLY public.categories
    ADD CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY (id)`);
    await queryRunner.query(`ALTER TABLE ONLY public.kot_items
    ADD CONSTRAINT "PK_3bd0b14c3bf87a04d6a8bec1be2" PRIMARY KEY (id)`);
    await queryRunner.query(`ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT "PK_5106efb01eeda7e49a78b869738" PRIMARY KEY (id)`);
    await queryRunner.query(`ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT "PK_668cef7c22a427fd822cc1be3ce" PRIMARY KEY (id)`);
    await queryRunner.query(`ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY (id)`);
    await queryRunner.query(`ALTER TABLE ONLY public.tables
    ADD CONSTRAINT "PK_7cf2aca7af9550742f855d4eb69" PRIMARY KEY (id)`);
    await queryRunner.query(`ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY (id)`);
    await queryRunner.query(`ALTER TABLE ONLY public.kots
    ADD CONSTRAINT "PK_7eef8feec5ea812621f25aa401d" PRIMARY KEY (id)`);
    await queryRunner.query(`ALTER TABLE ONLY public.branches
    ADD CONSTRAINT "PK_7f37d3b42defea97f1df0d19535" PRIMARY KEY (id)`);
    await queryRunner.query(`ALTER TABLE ONLY public.recipes
    ADD CONSTRAINT "PK_8f09680a51bf3669c1598a21682" PRIMARY KEY (id)`);
    await queryRunner.query(`ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT "PK_94c3ceb17e3140abc9282c20610" PRIMARY KEY (id)`);
    await queryRunner.query(`ALTER TABLE ONLY public.loyalty_rules
    ADD CONSTRAINT "PK_94cb1aeb0c0ac95c2e9bbcdbd11" PRIMARY KEY (id)`);
    await queryRunner.query(`ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT "PK_9b7144851f08f9eededde7edd42" PRIMARY KEY (id)`);
    await queryRunner.query(`ALTER TABLE ONLY public.users
    ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY (id)`);
    await queryRunner.query(`ALTER TABLE ONLY public.credit_transactions
    ADD CONSTRAINT "PK_a408319811d1ab32832ec86fc2c" PRIMARY KEY (id)`);
    await queryRunner.query(`ALTER TABLE ONLY public.credit_accounts
    ADD CONSTRAINT "PK_a81047fa386ce9ab9567c763d72" PRIMARY KEY (id)`);
    await queryRunner.query(`ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT "PK_b70ac51766a9e3144f778cfe81e" PRIMARY KEY (id)`);
    await queryRunner.query(`ALTER TABLE ONLY public.businesses
    ADD CONSTRAINT "PK_bc1bf63498dd2368ce3dc8686e8" PRIMARY KEY (id)`);
    await queryRunner.query(`ALTER TABLE ONLY public.roles
    ADD CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY (id)`);
    await queryRunner.query(`ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT "PK_cf2f451407242e132547ac19169" PRIMARY KEY (id)`);
    await queryRunner.query(`ALTER TABLE ONLY public.expense_categories
    ADD CONSTRAINT "PK_d0ef31e189d9523461215b62775" PRIMARY KEY (id)`);
    await queryRunner.query(`ALTER TABLE ONLY public.recipe_items
    ADD CONSTRAINT "PK_daec78e42198e9c42e1fed60eec" PRIMARY KEY (id)`);
    await queryRunner.query(`ALTER TABLE ONLY public.loyalty_transactions
    ADD CONSTRAINT "PK_df453f678b7575221b335673362" PRIMARY KEY (id)`);
    await queryRunner.query(`ALTER TABLE ONLY public.table_areas
    ADD CONSTRAINT "PK_e388eeb889ae8a7862837f022de" PRIMARY KEY (id)`);
    await queryRunner.query(`ALTER TABLE ONLY public.purchase_items
    ADD CONSTRAINT "PK_e3d9bea880baad86ff6de3290da" PRIMARY KEY (id)`);
    await queryRunner.query(`ALTER TABLE ONLY public.order_status_history
    ADD CONSTRAINT "PK_e6c66d853f155531985fc4f6ec8" PRIMARY KEY (id)`);
    await queryRunner.query(`ALTER TABLE ONLY public.credit_accounts
    ADD CONSTRAINT "REL_279e6d8ce4b1067eb58cd09756" UNIQUE (customer_id)`);
    await queryRunner.query(`ALTER TABLE ONLY public.roles
    ADD CONSTRAINT "UQ_0e74e16197c67d69c515ae3b7ec" UNIQUE (business_id, name)`);
    await queryRunner.query(`ALTER TABLE ONLY public.categories
    ADD CONSTRAINT "UQ_108cff1cf3a679074531948deda" UNIQUE (business_id, name)`);
    await queryRunner.query(`ALTER TABLE ONLY public.credit_accounts
    ADD CONSTRAINT "UQ_5e9d1fb7ef2aa2268b87c3714af" UNIQUE (business_id, customer_id)`);
    await queryRunner.query(`ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT "UQ_ea83c3b911906a3578de2340fdf" UNIQUE (order_id)`);
    await queryRunner.query(`ALTER TABLE ONLY public.recipes
    ADD CONSTRAINT "UQ_f64cfae3dc201348f591b4bf221" UNIQUE (product_id)`);
    await queryRunner.query(`CREATE INDEX "IDX_07889d42d0b29705cf4a649576" ON public.payments USING btree (business_id)`);
    await queryRunner.query(`CREATE INDEX "IDX_0e78f67403faf37092dce90d73" ON public.orders USING btree (business_id)`);
    await queryRunner.query(`CREATE INDEX "IDX_145532db85752b29c57d2b7b1f" ON public.order_items USING btree (order_id)`);
    await queryRunner.query(`CREATE INDEX "IDX_17b723da2c12837f4bc21e3339" ON public.orders USING btree (branch_id)`);
    await queryRunner.query(`CREATE INDEX "IDX_1ae178ce4af6339c9b79727277" ON public.products USING btree (business_id, category_id)`);
    await queryRunner.query(`CREATE INDEX "IDX_1ca7d5228cf9dc589b60243933" ON public.order_status_history USING btree (order_id)`);
    await queryRunner.query(`CREATE INDEX "IDX_279e6d8ce4b1067eb58cd09756" ON public.credit_accounts USING btree (customer_id)`);
    await queryRunner.query(`CREATE INDEX "IDX_283e6bfdd38a7cc7fec643f72b" ON public.tables USING btree (branch_id)`);
    await queryRunner.query(`CREATE INDEX "IDX_29c8cd74f9d674e8e21e63c2db" ON public.credit_transactions USING btree (business_id)`);
    await queryRunner.query(`CREATE INDEX "IDX_2bea34d54ed62dcd71e88be71e" ON public.kot_items USING btree (kot_id)`);
    await queryRunner.query(`CREATE INDEX "IDX_2de4c7251ed3dd16f2f96ce45e" ON public.recipe_items USING btree (recipe_id)`);
    await queryRunner.query(`CREATE INDEX "IDX_33deb0fa3699d72c7d40382673" ON public.tables USING btree (table_area_id)`);
    await queryRunner.query(`CREATE INDEX "IDX_39f39219f9587d34638ccde8b6" ON public.loyalty_transactions USING btree (customer_id)`);
    await queryRunner.query(`CREATE INDEX "IDX_3bce7273c223f1db12d876562e" ON public.table_areas USING btree (branch_id)`);
    await queryRunner.query(`CREATE INDEX "IDX_3d36410e89a795172fa6e0dd96" ON public.orders USING btree (table_id)`);
    await queryRunner.query(`CREATE INDEX "IDX_3ddc983c5f7bcf132fd8732c3f" ON public.refresh_tokens USING btree (user_id)`);
    await queryRunner.query(`CREATE INDEX "IDX_40dfd40d6a48aa07d46fc73d73" ON public.inventory_transactions USING btree (business_id)`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_4167170ea74a9905ec5eb353b4" ON public.users USING btree (business_id, email)`);
    await queryRunner.query(`CREATE INDEX "IDX_52ff448f421834176957b7e471" ON public.loyalty_rules USING btree (business_id)`);
    await queryRunner.query(`CREATE INDEX "IDX_55583046d0dcce116295075ee0" ON public.expense_categories USING btree (business_id)`);
    await queryRunner.query(`CREATE INDEX "IDX_563a5e248518c623eebd987d43" ON public.payments USING btree (invoice_id)`);
    await queryRunner.query(`CREATE INDEX "IDX_5a58f726a41264c8b3e86d4a1d" ON public.users USING btree (branch_id)`);
    await queryRunner.query(`CREATE INDEX "IDX_5ab413a6a1198692b7cc193eea" ON public.loyalty_transactions USING btree (business_id)`);
    await queryRunner.query(`CREATE INDEX "IDX_5ca9b9dc330c2fda66c6aa5e15" ON public.credit_transactions USING btree (invoice_id)`);
    await queryRunner.query(`CREATE INDEX "IDX_5d1f4be708e0dfe2afa1a3c376" ON public.expenses USING btree (category_id)`);
    await queryRunner.query(`CREATE INDEX "IDX_5d7de4238a311bbafda4282be7" ON public.credit_accounts USING btree (business_id)`);
    await queryRunner.query(`CREATE INDEX "IDX_607211d59b13e705a673a999ab" ON public.purchase_items USING btree (purchase_id)`);
    await queryRunner.query(`CREATE INDEX "IDX_65e3145f317bd655481d3f96c7" ON public.invoices USING btree (customer_id)`);
    await queryRunner.query(`CREATE INDEX "IDX_6706ea94d32be01f9272ccc351" ON public.products USING btree (business_id)`);
    await queryRunner.query(`CREATE INDEX "IDX_6b06d2cb149e7461d298eda900" ON public.purchases USING btree (branch_id)`);
    await queryRunner.query(`CREATE INDEX "IDX_748d17585f94b8c9776e9c13c9" ON public.kots USING btree (branch_id)`);
    await queryRunner.query(`CREATE INDEX "IDX_772d0ce0473ac2ccfa26060dbe" ON public.orders USING btree (customer_id)`);
    await queryRunner.query(`CREATE INDEX "IDX_775c9f06fc27ae3ff8fb26f2c4" ON public.orders USING btree (status)`);
    await queryRunner.query(`CREATE INDEX "IDX_858a587cc6a59c4e231aade86f" ON public.kots USING btree (order_id)`);
    await queryRunner.query(`CREATE INDEX "IDX_866a3b82ff438efc19c2398cda" ON public.expenses USING btree (branch_id)`);
    await queryRunner.query(`CREATE INDEX "IDX_88acd889fbe17d0e16cc4bc917" ON public.customers USING btree (phone)`);
    await queryRunner.query(`CREATE INDEX "IDX_8be4d5110bff05094d246d62ae" ON public.loyalty_transactions USING btree (order_id)`);
    await queryRunner.query(`CREATE INDEX "IDX_8f96c84343bd7d6cb4374e9788" ON public.invoices USING btree (business_id)`);
    await queryRunner.query(`CREATE INDEX "IDX_91da72e2f6ec2a1c45a8f4aaf3" ON public.categories USING btree (business_id)`);
    await queryRunner.query(`CREATE INDEX "IDX_9a5f6868c96e0069e699f33e12" ON public.products USING btree (category_id)`);
    await queryRunner.query(`CREATE INDEX "IDX_b03cdb57ba2af2a4d185d8e81f" ON public.suppliers USING btree (business_id)`);
    await queryRunner.query(`CREATE INDEX "IDX_b50ef2c264e6c0fda8c639935a" ON public.payments USING btree (branch_id)`);
    await queryRunner.query(`CREATE INDEX "IDX_b6ac028866ef85f79f04581ef2" ON public.branches USING btree (business_id)`);
    await queryRunner.query(`CREATE INDEX "IDX_bbe1a0623e423441c89937a74b" ON public.refunds USING btree (invoice_id)`);
    await queryRunner.query(`CREATE INDEX "IDX_c04b1ab3076e753f96c6431828" ON public.customers USING btree (business_id)`);
    await queryRunner.query(`CREATE INDEX "IDX_c884e321f927d5b86aac7c8f9e" ON public.orders USING btree (created_at)`);
    await queryRunner.query(`CREATE INDEX "IDX_c8bc6d59f7c92922a2c691548d" ON public.credit_transactions USING btree (credit_account_id)`);
    await queryRunner.query(`CREATE INDEX "IDX_cd66f3688c45699bb2d981bc0f" ON public.inventory_items USING btree (business_id)`);
    await queryRunner.query(`CREATE INDEX "IDX_cde4b2aabca86cfabdc78b537f" ON public.users USING btree (business_id)`);
    await queryRunner.query(`CREATE INDEX "IDX_d387567f1f55c4d1445548ed34" ON public.inventory_transactions USING btree (branch_id)`);
    await queryRunner.query(`CREATE INDEX "IDX_d5fec047f705d5b510c19379b9" ON public.purchases USING btree (supplier_id)`);
    await queryRunner.query(`CREATE INDEX "IDX_e72ff3d54aa54059dbd70c41ee" ON public.inventory_transactions USING btree (inventory_item_id)`);
    await queryRunner.query(`CREATE INDEX "IDX_e8a2a414622ffc619ca396d90d" ON public.purchases USING btree (business_id)`);
    await queryRunner.query(`CREATE INDEX "IDX_ef28e0814977f1c47575f0814c" ON public.expenses USING btree (business_id)`);
    await queryRunner.query(`CREATE INDEX "IDX_f8b468df52fb45053ad0c4ca38" ON public.invoices USING btree (branch_id)`);
    await queryRunner.query(`ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "FK_07889d42d0b29705cf4a649576b" FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "FK_0e78f67403faf37092dce90d73a" FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "FK_145532db85752b29c57d2b7b1f1" FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "FK_17b723da2c12837f4bc21e33398" FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE ONLY public.order_status_history
    ADD CONSTRAINT "FK_1ca7d5228cf9dc589b60243933c" FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE ONLY public.kot_items
    ADD CONSTRAINT "FK_1d28330be8d397459774946fef3" FOREIGN KEY (order_item_id) REFERENCES public.order_items(id) ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE ONLY public.loyalty_transactions
    ADD CONSTRAINT "FK_2679fa1c9822edf0caa8cdcd6ee" FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL`);
    await queryRunner.query(`ALTER TABLE ONLY public.credit_accounts
    ADD CONSTRAINT "FK_279e6d8ce4b1067eb58cd09756e" FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE ONLY public.tables
    ADD CONSTRAINT "FK_283e6bfdd38a7cc7fec643f72b6" FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE ONLY public.credit_transactions
    ADD CONSTRAINT "FK_29c8cd74f9d674e8e21e63c2db5" FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "FK_2b505576ec68c4d47782a51a832" FOREIGN KEY (created_by) REFERENCES public.users(id)`);
    await queryRunner.query(`ALTER TABLE ONLY public.kot_items
    ADD CONSTRAINT "FK_2bea34d54ed62dcd71e88be71e5" FOREIGN KEY (kot_id) REFERENCES public.kots(id) ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE ONLY public.recipe_items
    ADD CONSTRAINT "FK_2de4c7251ed3dd16f2f96ce45ed" FOREIGN KEY (recipe_id) REFERENCES public.recipes(id) ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE ONLY public.tables
    ADD CONSTRAINT "FK_33deb0fa3699d72c7d40382673f" FOREIGN KEY (table_area_id) REFERENCES public.table_areas(id) ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT "FK_39a202af5d1dd1744458820ecb5" FOREIGN KEY (created_by) REFERENCES public.users(id)`);
    await queryRunner.query(`ALTER TABLE ONLY public.loyalty_transactions
    ADD CONSTRAINT "FK_39f39219f9587d34638ccde8b67" FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE ONLY public.table_areas
    ADD CONSTRAINT "FK_3bce7273c223f1db12d876562e4" FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "FK_3d36410e89a795172fa6e0dd968" FOREIGN KEY (table_id) REFERENCES public.tables(id) ON DELETE SET NULL`);
    await queryRunner.query(`ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT "FK_40dfd40d6a48aa07d46fc73d733" FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE ONLY public.loyalty_rules
    ADD CONSTRAINT "FK_52ff448f421834176957b7e4710" FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE ONLY public.expense_categories
    ADD CONSTRAINT "FK_55583046d0dcce116295075ee07" FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "FK_563a5e248518c623eebd987d43e" FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "FK_574a2f0932043d4e4baf188ee05" FOREIGN KEY (created_by) REFERENCES public.users(id)`);
    await queryRunner.query(`ALTER TABLE ONLY public.users
    ADD CONSTRAINT "FK_5a58f726a41264c8b3e86d4a1de" FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL`);
    await queryRunner.query(`ALTER TABLE ONLY public.loyalty_transactions
    ADD CONSTRAINT "FK_5ab413a6a1198692b7cc193eea2" FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE ONLY public.credit_transactions
    ADD CONSTRAINT "FK_5ca9b9dc330c2fda66c6aa5e158" FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE SET NULL`);
    await queryRunner.query(`ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT "FK_5d1f4be708e0dfe2afa1a3c376c" FOREIGN KEY (category_id) REFERENCES public.expense_categories(id) ON DELETE SET NULL`);
    await queryRunner.query(`ALTER TABLE ONLY public.credit_accounts
    ADD CONSTRAINT "FK_5d7de4238a311bbafda4282be7d" FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE ONLY public.purchase_items
    ADD CONSTRAINT "FK_607211d59b13e705a673a999ab5" FOREIGN KEY (purchase_id) REFERENCES public.purchases(id) ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT "FK_65e3145f317bd655481d3f96c74" FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL`);
    await queryRunner.query(`ALTER TABLE ONLY public.products
    ADD CONSTRAINT "FK_6706ea94d32be01f9272ccc3512" FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT "FK_6b06d2cb149e7461d298eda9002" FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT "FK_70ebb313de49b0256d21b1527d4" FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL`);
    await queryRunner.query(`ALTER TABLE ONLY public.kots
    ADD CONSTRAINT "FK_748d17585f94b8c9776e9c13c96" FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "FK_772d0ce0473ac2ccfa26060dbe9" FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL`);
    await queryRunner.query(`ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT "FK_7c0c012c2f8e6578277c239ee61" FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL`);
    await queryRunner.query(`ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT "FK_7f48aa5d56c42aeb495db016683" FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE RESTRICT`);
    await queryRunner.query(`ALTER TABLE ONLY public.kots
    ADD CONSTRAINT "FK_858a587cc6a59c4e231aade86fd" FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT "FK_866a3b82ff438efc19c2398cda6" FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE ONLY public.loyalty_transactions
    ADD CONSTRAINT "FK_8be4d5110bff05094d246d62aed" FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL`);
    await queryRunner.query(`ALTER TABLE ONLY public.kots
    ADD CONSTRAINT "FK_8d163ccd308eaec6a52d2cdafde" FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL`);
    await queryRunner.query(`ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT "FK_8f96c84343bd7d6cb4374e9788f" FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE ONLY public.categories
    ADD CONSTRAINT "FK_91da72e2f6ec2a1c45a8f4aaf30" FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "FK_9263386c35b6b242540f9493b00" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT`);
    await queryRunner.query(`ALTER TABLE ONLY public.products
    ADD CONSTRAINT "FK_9a5f6868c96e0069e699f33e124" FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE RESTRICT`);
    await queryRunner.query(`ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT "FK_9d0d05da25f329ca066d639af7d" FOREIGN KEY (cancelled_by) REFERENCES public.users(id) ON DELETE SET NULL`);
    await queryRunner.query(`ALTER TABLE ONLY public.users
    ADD CONSTRAINT "FK_a2cecd1a3531c0b041e29ba46e1" FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE RESTRICT`);
    await queryRunner.query(`ALTER TABLE ONLY public.credit_transactions
    ADD CONSTRAINT "FK_a3d50a7c52eda4b1a1124834a2b" FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL`);
    await queryRunner.query(`ALTER TABLE ONLY public.recipe_items
    ADD CONSTRAINT "FK_a8d8dfd3ab01236c45782099084" FOREIGN KEY (inventory_item_id) REFERENCES public.inventory_items(id) ON DELETE RESTRICT`);
    await queryRunner.query(`ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT "FK_b03cdb57ba2af2a4d185d8e81f5" FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "FK_b50ef2c264e6c0fda8c639935af" FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE ONLY public.purchase_items
    ADD CONSTRAINT "FK_b669f4f841b78161f5375e2fdd1" FOREIGN KEY (inventory_item_id) REFERENCES public.inventory_items(id) ON DELETE RESTRICT`);
    await queryRunner.query(`ALTER TABLE ONLY public.branches
    ADD CONSTRAINT "FK_b6ac028866ef85f79f04581ef26" FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT "FK_bbe1a0623e423441c89937a74bd" FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE ONLY public.customers
    ADD CONSTRAINT "FK_c04b1ab3076e753f96c64318286" FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE ONLY public.credit_transactions
    ADD CONSTRAINT "FK_c8bc6d59f7c92922a2c691548d7" FOREIGN KEY (credit_account_id) REFERENCES public.credit_accounts(id) ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT "FK_cd66f3688c45699bb2d981bc0f3" FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE ONLY public.roles
    ADD CONSTRAINT "FK_cd750f8c7a7cb867515c3bbdb91" FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE ONLY public.users
    ADD CONSTRAINT "FK_cde4b2aabca86cfabdc78b537f0" FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT "FK_d387567f1f55c4d1445548ed34f" FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT "FK_d5fec047f705d5b510c19379b95" FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE RESTRICT`);
    await queryRunner.query(`ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT "FK_d9a2ac973b889087b33f84d3517" FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL`);
    await queryRunner.query(`ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT "FK_dcf8f786aaeb2746c93a332b635" FOREIGN KEY (created_by) REFERENCES public.users(id)`);
    await queryRunner.query(`ALTER TABLE ONLY public.order_status_history
    ADD CONSTRAINT "FK_de5bb51ff61072261b6b3419f83" FOREIGN KEY (changed_by) REFERENCES public.users(id) ON DELETE SET NULL`);
    await queryRunner.query(`ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT "FK_e72ff3d54aa54059dbd70c41ee9" FOREIGN KEY (inventory_item_id) REFERENCES public.inventory_items(id) ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT "FK_e8a2a414622ffc619ca396d90dd" FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT "FK_ea83c3b911906a3578de2340fdf" FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT "FK_ef28e0814977f1c47575f0814c7" FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE ONLY public.recipes
    ADD CONSTRAINT "FK_f64cfae3dc201348f591b4bf221" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT "FK_f8b468df52fb45053ad0c4ca38b" FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS public."users" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS public."tables" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS public."table_areas" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS public."suppliers" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS public."roles" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS public."refunds" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS public."refresh_tokens" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS public."recipes" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS public."recipe_items" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS public."purchases" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS public."purchase_items" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS public."products" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS public."payments" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS public."orders" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS public."order_status_history" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS public."order_items" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS public."loyalty_transactions" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS public."loyalty_rules" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS public."kots" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS public."kot_items" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS public."invoices" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS public."inventory_transactions" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS public."inventory_items" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS public."expenses" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS public."expense_categories" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS public."customers" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS public."credit_transactions" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS public."credit_accounts" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS public."categories" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS public."businesses" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS public."branches" CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS public."tables_status_enum" CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS public."purchases_payment_status_enum" CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS public."payments_payment_method_enum" CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS public."orders_status_enum" CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS public."orders_order_type_enum" CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS public."order_items_status_enum" CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS public."loyalty_transactions_type_enum" CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS public."kots_status_enum" CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS public."kot_items_status_enum" CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS public."invoices_status_enum" CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS public."inventory_transactions_type_enum" CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS public."credit_transactions_type_enum" CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS public."branches_status_enum" CASCADE`);
    try {
      await queryRunner.query(`DROP FUNCTION IF EXISTS public.uuid_generate_v4() CASCADE`);
      await queryRunner.query(`DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE`);
    } catch {
      // Ignore cleanup error if restricted
    }
  }
}
