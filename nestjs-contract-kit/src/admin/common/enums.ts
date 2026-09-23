// Shared enums — single source of truth for roles, permissions and statuses.

export enum AdminRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
}

export enum Permission {
  VIEW_CUSTOMERS = 'VIEW_CUSTOMERS',
  VIEW_WALLETS = 'VIEW_WALLETS',
  VERIFY_PAYMENTS = 'VERIFY_PAYMENTS',
  MANAGE_BUY_LISTINGS = 'MANAGE_BUY_LISTINGS',
  MANAGE_DEMAND_LISTINGS = 'MANAGE_DEMAND_LISTINGS',
  APPROVE_BUY = 'APPROVE_BUY',
  APPROVE_SELL = 'APPROVE_SELL',
  VIEW_REPORTS = 'VIEW_REPORTS',
  MANAGE_PAYMENT_SETTINGS = 'MANAGE_PAYMENT_SETTINGS',
  MANAGE_ADMINS = 'MANAGE_ADMINS',
  VIEW_AUDIT_LOGS = 'VIEW_AUDIT_LOGS',
}

export enum AdminStatus {
  ACTIVE = 'ACTIVE',
  DISABLED = 'DISABLED',
}

export enum ListingStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  CLOSED = 'CLOSED',
}

export enum RequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export enum ReportType {
  DEPOSITS = 'deposits',
  BUY_TRANSACTIONS = 'buy-transactions',
  SELL_TRANSACTIONS = 'sell-transactions',
  DOLLAR_VOLUME = 'dollar-volume',
  WALLET_TRANSACTIONS = 'wallet-transactions',
  PAYMENT_VERIFICATIONS = 'payment-verifications',
  PENDING_TRANSACTIONS = 'pending-transactions',
  ADMIN_ACTIVITY = 'admin-activity',
}
