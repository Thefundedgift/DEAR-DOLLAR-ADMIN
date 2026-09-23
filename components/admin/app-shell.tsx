'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import type { Permission } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import {
  CircleDollarSign,
  LayoutDashboard,
  Users,
  Banknote,
  ShoppingCart,
  Megaphone,
  CheckCircle2,
  ArrowDownUp,
  BadgeIndianRupee,
  FileBarChart,
  ScrollText,
  Settings2,
  ShieldCheck,
  Link2,
  LogOut,
  Menu,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: Permission;
  superAdminOnly?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Overview',
    items: [{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }],
  },
  {
    title: 'Customers',
    items: [
      { label: 'Customers', href: '/customers', icon: Users, permission: 'VIEW_CUSTOMERS' },
      { label: 'Withdrawals', href: '/withdrawals', icon: Banknote, permission: 'VIEW_WALLETS' },
    ],
  },
  {
    title: 'Market',
    items: [
      { label: 'Buy Listings', href: '/buy-listings', icon: ShoppingCart, permission: 'MANAGE_BUY_LISTINGS' },
      { label: 'Demand Listings', href: '/demand-listings', icon: Megaphone, permission: 'MANAGE_DEMAND_LISTINGS' },
    ],
  },
  {
    title: 'Approvals',
    items: [
      { label: 'Buy Approvals', href: '/buy-requests', icon: CheckCircle2, permission: 'APPROVE_BUY' },
      { label: 'Sell Approvals', href: '/sell-requests', icon: ArrowDownUp, permission: 'APPROVE_SELL' },
      { label: 'Payment Verification', href: '/payments', icon: BadgeIndianRupee, permission: 'VERIFY_PAYMENTS' },
    ],
  },
  {
    title: 'Insights',
    items: [
      { label: 'Reports', href: '/reports', icon: FileBarChart, permission: 'VIEW_REPORTS' },
      { label: 'Audit Logs', href: '/audit-logs', icon: ScrollText, permission: 'VIEW_AUDIT_LOGS' },
    ],
  },
  {
    title: 'Administration',
    items: [
      { label: 'Payment Settings', href: '/payment-settings', icon: Settings2, permission: 'MANAGE_PAYMENT_SETTINGS', superAdminOnly: true },
      { label: 'Admin Management', href: '/admins', icon: ShieldCheck, permission: 'MANAGE_ADMINS', superAdminOnly: true },
      { label: 'Social Links', href: '/settings', icon: Link2, superAdminOnly: true },
    ],
  },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { admin, can } = useAuth();

  return (
    <div className="flex h-full flex-col bg-slate-950">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500">
          <CircleDollarSign className="h-5 w-5 text-slate-950" />
        </div>
        <div>
          <p className="text-sm font-bold tracking-wide text-white">DEAR DOLLAR</p>
          <p className="text-[10px] uppercase tracking-widest text-emerald-400">Admin Panel</p>
        </div>
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {NAV_GROUPS.map((group) => {
          const visible = group.items.filter((item) => {
            if (item.superAdminOnly && admin?.role !== 'SUPER_ADMIN') return false;
            return can(item.permission);
          });
          if (visible.length === 0) return null;
          return (
            <div key={group.title}>
              <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                {group.title}
              </p>
              <div className="space-y-0.5">
                {visible.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      data-testid={`nav-${item.href.replace('/', '')}`}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                        active
                          ? 'bg-emerald-500/15 font-medium text-emerald-400'
                          : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-100'
                      }`}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
      <p className="border-t border-slate-800 px-5 py-3 text-[10px] uppercase tracking-widest text-slate-600">
        Powered by <span className="text-slate-400">INTERNET ZONE</span>
      </p>
    </div>
  );
}

export function AdminShell({
  children,
  permission,
  superAdminOnly = false,
}: {
  children: React.ReactNode;
  permission?: Permission;
  superAdminOnly?: boolean;
}) {
  const { admin, initialized, logout, can } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (initialized && !admin) router.replace('/login');
  }, [initialized, admin, router]);

  if (!initialized || !admin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const authorized = (!superAdminOnly || admin.role === 'SUPER_ADMIN') && can(permission);

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-800 md:block">
        <SidebarContent />
      </aside>

      <div className="md:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 border-slate-800 bg-slate-950 p-0">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <SidebarContent onNavigate={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>
            <span className="hidden text-sm text-slate-400 sm:block">DEAR DOLLAR · Point Market Administration</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight text-slate-900" data-testid="header-admin-name">{admin.name || admin.email}</p>
              <p className="text-xs text-slate-500">{admin.email}</p>
            </div>
            <Badge
              variant="outline"
              className={
                admin.role === 'SUPER_ADMIN'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-slate-50 text-slate-700'
              }
            >
              {admin.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
            </Badge>
            <Button variant="ghost" size="icon" onClick={() => logout()} data-testid="logout-button" aria-label="Logout">
              <LogOut className="h-4 w-4 text-slate-500" />
            </Button>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          {authorized ? (
            children
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white py-20" data-testid="access-denied">
              <ShieldAlert className="h-10 w-10 text-red-400" />
              <h2 className="text-lg font-semibold text-slate-900">Access denied</h2>
              <p className="max-w-sm text-center text-sm text-slate-500">
                Your admin account does not have permission to view this section. Contact a Super Admin if you
                believe this is a mistake.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
