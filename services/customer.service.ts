import { api } from '@/lib/api-client';
import type { BankDetails, Customer, Paginated, Transaction, Wallet, Withdrawal } from '@/types';

export const customerService = {
  async list(params: { search?: string; page?: number; limit?: number } = {}): Promise<Paginated<Customer>> {
    const { data } = await api.get<Paginated<Customer>>('/admin/customers', { params });
    return data;
  },

  async getById(id: string): Promise<Customer> {
    const { data } = await api.get<Customer>(`/admin/customers/${id}`);
    return data;
  },

  async getMoneyWallet(id: string): Promise<Wallet> {
    const { data } = await api.get<Wallet>(`/admin/customers/${id}/money-wallet`);
    return data;
  },

  async getPointWallet(id: string): Promise<Wallet> {
    const { data } = await api.get<Wallet>(`/admin/customers/${id}/point-wallet`);
    return data;
  },

  async getTransactions(id: string, params: { page?: number; limit?: number } = {}): Promise<Paginated<Transaction>> {
    const { data } = await api.get<Paginated<Transaction>>(`/admin/customers/${id}/transactions`, { params });
    return data;
  },

  async getBankDetails(id: string): Promise<BankDetails> {
    const { data } = await api.get<BankDetails>(`/admin/customers/${id}/bank-details`);
    return data;
  },

  // Money withdrawal requests
  async listWithdrawals(params: { status?: string; page?: number; limit?: number } = {}): Promise<Paginated<Withdrawal>> {
    const { data } = await api.get<Paginated<Withdrawal>>('/admin/withdrawals', { params });
    return data;
  },

  async approveWithdrawal(id: string, note?: string): Promise<Withdrawal> {
    const { data } = await api.post<Withdrawal>(`/admin/withdrawals/${id}/approve`, { note });
    return data;
  },

  async rejectWithdrawal(id: string, reason: string): Promise<Withdrawal> {
    const { data } = await api.post<Withdrawal>(`/admin/withdrawals/${id}/reject`, { reason });
    return data;
  },
};
