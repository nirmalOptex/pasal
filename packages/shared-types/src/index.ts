// User & Auth Enums
export enum UserRoleType {
  OWNER = 'OWNER',
  BRANCH_MANAGER = 'BRANCH_MANAGER',
  CASHIER = 'CASHIER',
  WAITER = 'WAITER',
  KITCHEN_STAFF = 'KITCHEN_STAFF',
}

export enum BranchStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

// Table Enums
export enum TableStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  RESERVED = 'RESERVED',
  CLEANING = 'CLEANING',
}

// Order Enums
export enum OrderType {
  DINE_IN = 'DINE_IN',
  TAKEAWAY = 'TAKEAWAY',
  DELIVERY = 'DELIVERY',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  SERVED = 'SERVED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum OrderItemStatus {
  PENDING = 'PENDING',
  PREPARING = 'PREPARING',
  READY = 'READY',
  SERVED = 'SERVED',
  CANCELLED = 'CANCELLED',
}

// KOT Enums
export enum KotStatus {
  NEW = 'NEW',
  PREPARING = 'PREPARING',
  READY = 'READY',
  SERVED = 'SERVED',
}

// Billing & Payment Enums
export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  ISSUED = 'ISSUED',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  QR = 'QR',
  CARD = 'CARD',
  CREDIT = 'CREDIT',
}

// Customer Credit / Khata Enums
export enum CreditTransactionType {
  DEBIT = 'DEBIT',   // Customer owes more
  CREDIT = 'CREDIT', // Customer paid / settled
}

// Inventory Enums
export enum InventoryTransactionType {
  PURCHASE = 'PURCHASE',
  SALE = 'SALE',
  ADJUSTMENT = 'ADJUSTMENT',
  WASTAGE = 'WASTAGE',
  RETURN = 'RETURN',
}

export enum PurchasePaymentStatus {
  UNPAID = 'UNPAID',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID',
}

// Loyalty Enums
export enum LoyaltyTransactionType {
  EARN = 'EARN',
  REDEEM = 'REDEEM',
  ADJUST = 'ADJUST',
}

// Common response interface
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: any;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

// Auth payload
export interface JwtUserPayload {
  userId: string;
  businessId: string;
  branchId?: string | null;
  roleId: string;
  roleName: string;
  permissions: string[];
}
