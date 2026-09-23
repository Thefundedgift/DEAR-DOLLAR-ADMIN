import { AdminRole, AdminStatus, Permission } from './enums';

// Public admin profile — NEVER include passwordHash or tokens in responses.
export interface AdminProfile {
  id: string;
  name: string;
  email: string;
  mobile?: string;
  role: AdminRole;
  permissions: Permission[];
  status: AdminStatus;
  createdAt?: Date | string;
  lastLoginAt?: Date | string;
}

// Internal record (persistence layer only)
export interface AdminUserRecord extends AdminProfile {
  passwordHash: string;
}

export const toProfile = (a: AdminUserRecord): AdminProfile => {
  const { passwordHash: _omit, ...profile } = a;
  return profile;
};

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

export interface RequestContext {
  adminId: string;
  ip?: string;
}
