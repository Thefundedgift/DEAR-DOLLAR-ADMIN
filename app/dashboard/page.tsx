'use client';

import { AdminShell } from '@/components/admin/app-shell';
import { PageHeader, StatCard, LoadingState, ErrorState } from '@/components/admin/shared';
import { useApi } from '@/hooks/use-api';
import { dashboardService } from '@/services/dashboard.service';
import { formatMoney, formatNumber, formatDollar } from '@/lib/format';
import {
  Users,
  Banknote,
  Clock3,
  ShoppingCart,
  ArrowDownUp,
  TrendingUp,
  TrendingDown,
  Store,
  Megaphone,
} from 'lucide-react';

export default function DashboardPage() {
  const { data, loading, error, refetch } = useApi(() => dashboardService.getStats(), []);

  return (
    <AdminShell>
      <PageHeader
        title="Dashboard"
        description="Live overview of the DEAR DOLLAR point market, fetched from the backend API."
      />
      {loading && <LoadingState />}
      {!loading && error && <ErrorState message={error} onRetry={refetch} />}
      {!loading && !error && data && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard label="Total Customers" value={formatNumber(data.totalCustomers)} icon={Users} accent="bg-blue-50 text-blue-600" />
          <StatCard label="Total Money Deposits" value={formatMoney(data.totalMoneyDeposits)} icon={Banknote} accent="bg-emerald-50 text-emerald-600" />
          <StatCard label="Pending Payments" value={formatNumber(data.pendingPayments)} icon={Clock3} accent="bg-amber-50 text-amber-600" />
          <StatCard label="Pending Buy Requests" value={formatNumber(data.pendingBuyRequests)} icon={ShoppingCart} accent="bg-amber-50 text-amber-600" />
          <StatCard label="Pending Sell Requests" value={formatNumber(data.pendingSellRequests)} icon={ArrowDownUp} accent="bg-amber-50 text-amber-600" />
          <StatCard label="Total $dollar Purchased" value={formatDollar(data.totalDollarPurchased)} icon={TrendingUp} accent="bg-emerald-50 text-emerald-600" />
          <StatCard label="Total $dollar Sold" value={formatDollar(data.totalDollarSold)} icon={TrendingDown} accent="bg-rose-50 text-rose-600" />
          <StatCard label="Active Buy Listings" value={formatNumber(data.activeBuyListings)} icon={Store} accent="bg-blue-50 text-blue-600" />
          <StatCard label="Active Demand Listings" value={formatNumber(data.activeDemandListings)} icon={Megaphone} accent="bg-purple-50 text-purple-600" />
        </div>
      )}
    </AdminShell>
  );
}
