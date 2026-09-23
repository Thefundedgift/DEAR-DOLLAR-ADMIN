// ============================================================
// DEAR DOLLAR Admin Panel - Shared TypeScript types
// These types mirror the API contract of the existing NestJS
// POINT MARKET backend (see API_CONTRACT.md).
// ============================================================

export type AdminRole = 'SUPER_ADMIN' | 'ADMIN';

export type Permission =
  | 'VIEW_CUSTOMERS'
  | 'VIEW_WALLETS'
  | 'VERIFY_PAYMENTS'
  | 'MANAGE_BUY_LISTINGS'
  | 'MANAGE_DEMAND_LISTINGS'
  | 'APPROVE_BUY'
  | 'APPROVE_SELL'
  | 'VIEW_REPORTS'
  | 'MANAGE_PAYMENT_SETTINGS'
  | 'MANAGE_ADMINS'
  | 'VIEW_AUDIT_LOGS';

export const ALL_PERMISSIONS: Permission[] = [
  'VIEW_CUSTOMERS',
  'VIEW_WALLETS',
  'VERIFY_PAYMENTS',
  'MANAGE_BUY_LISTINGS',
  'MANAGE_DEMAND_LISTINGS',
  'APPROVE_BUY',
  'APPROVE_SELL',
  'VIEW_REPORTS',
  'MANAGE_PAYMENT_SETTINGS',
  'MANAGE_ADMINS',
  'VIEW_AUDIT_LOGS',
];

export interface AdminProfile {
  id: string;
  name: string;
  email: string;
  mobile?: string;
  role: AdminRole;
  permissions: Permission[];
  status: 'ACTIVE' | 'DISABLED';
  createdAt?: string;
  lastLoginAt?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  admin: AdminProfile;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface DashboardStats {
  totalCustomers: number;
  totalMoneyDeposits: number;
  pendingPayments: number;
  pendingBuyRequests: number;
  pendingSellRequests: number;
  totalDollarPurchased: number;
  totalDollarSold: number;
  activeBuyListings: number;
  activeDemandListings: number;
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  status: string;
  createdAt: string;
}

export interface Wallet {
  balance: number;
  currency?: string;
  locked?: number;
  updatedAt?: string;
}

export interface Transaction {
  id: string;
  type: string;
  wallet?: 'MONEY' | 'POINT';
  direction?: 'CREDIT' | 'DEBIT';
  amount: number;
  balanceAfter?: number;
  status: string;
  description?: string;
  createdAt: string;
}

export interface BankDetails {
  accountHolder?: string;
  accountNumber?: string;
  ifsc?: string;
  bankName?: string;
  upiId?: string;
}

export interface Withdrawal {
  id: string;
  customer?: Customer;
  customerId?: string;
  amount: number;
  status: string;
  bankDetails?: BankDetails;
  createdAt: string;
}

export type ListingStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'CLOSED';

export interface BuyListing {
  id: string;
  title: string;
  description?: string;
  moneyValue: number;
  pointQuantity: number;
  availableQuantity: number;
  startDate?: string;
  endDate?: string;
  status: ListingStatus;
  createdAt?: string;
}

export interface DemandListing {
  id: string;
  title: string;
  description?: string;
  moneyValue: number;
  pointQuantity: number;
  demandQuantity: number;
  remainingQuantity: number;
  startDate?: string;
  endDate?: string;
  status: ListingStatus;
  createdAt?: string;
}

export interface BuyRequest {
  id: string;
  customer?: Customer;
  dollarQuantity: number;
  rate: number;
  amount: number;
  listing?: { id: string; title: string };
  status: string;
  createdAt: string;
}

export interface SellRequest {
  id: string;
  customer?: Customer;
  dollarQuantity: number;
  rate: number;
  expectedAmount: number;
  demandListing?: { id: string; title: string };
  status: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  customer?: Customer;
  paymentId?: string;
  amount: number;
  utr?: string;
  upiId?: string;
  paidAt?: string;
  status: string;
  createdAt: string;
}

export interface PaymentSettings {
  id?: string;
  upiId: string;
  merchantName: string;
  qrImageUrl?: string;
  instructions?: string;
  enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: { id: string; name: string };
}

export interface AuditLog {
  id: string;
  admin?: { id: string; name: string; email?: string };
  action: string;
  entity: string;
  entityId?: string;
  oldValue?: Record<string, unknown> | string | null;
  newValue?: Record<string, unknown> | string | null;
  ip?: string;
  createdAt: string;
}

export interface SocialLinks {
  telegramUrl?: string;
  telegramEnabled: boolean;
  discordUrl?: string;
  discordEnabled: boolean;
  updatedAt?: string;
}

export type ReportType =
  | 'deposits'
  | 'buy-transactions'
  | 'sell-transactions'
  | 'dollar-volume'
  | 'wallet-transactions'
  | 'payment-verifications'
  | 'pending-transactions'
  | 'admin-activity';

export interface ReportFilters {
  from?: string;
  to?: string;
  customerId?: string;
  status?: string;
  type?: string;
  page?: number;
  limit?: number;
}

export type ReportRow = Record<string, unknown>;
