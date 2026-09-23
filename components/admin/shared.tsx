'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2, ServerCrash, Inbox, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ---------- Page header ----------
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

// ---------- Stat card ----------
export function StatCard({
  label,
  value,
  icon: Icon,
  accent = 'text-emerald-600 bg-emerald-50',
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm" data-testid={`stat-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${accent}`}>
          <Icon className="h-4.5 w-4.5 h-5 w-5" />
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

// ---------- Async states ----------
export function LoadingState({ label = 'Loading from backend...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 bg-white py-16" data-testid="loading-state">
      <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Alert variant="destructive" className="bg-red-50" data-testid="error-state">
      <ServerCrash className="h-4 w-4" />
      <AlertTitle>Backend API error</AlertTitle>
      <AlertDescription className="mt-1 break-words">
        {message}
        {onRetry && (
          <div className="mt-3">
            <Button size="sm" variant="outline" onClick={onRetry} className="border-red-300 bg-white text-red-700 hover:bg-red-100">
              <RefreshCw className="mr-2 h-3.5 w-3.5" /> Retry
            </Button>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}

export function EmptyState({ message = 'No records found.' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-white py-16" data-testid="empty-state">
      <Inbox className="h-8 w-8 text-slate-300" />
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}

// ---------- Status badge ----------
const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  APPROVED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  VERIFIED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  COMPLETED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  SUCCESS: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  ENABLED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  PROCESSING: 'bg-amber-100 text-amber-800 border-amber-200',
  PAUSED: 'bg-slate-100 text-slate-700 border-slate-200',
  DRAFT: 'bg-slate-100 text-slate-700 border-slate-200',
  REJECTED: 'bg-red-100 text-red-800 border-red-200',
  FAILED: 'bg-red-100 text-red-800 border-red-200',
  CLOSED: 'bg-red-100 text-red-800 border-red-200',
  DISABLED: 'bg-red-100 text-red-800 border-red-200',
  BLOCKED: 'bg-red-100 text-red-800 border-red-200',
};

export function StatusBadge({ status }: { status?: string }) {
  const s = (status || 'UNKNOWN').toUpperCase();
  const cls = STATUS_STYLES[s] || 'bg-slate-100 text-slate-700 border-slate-200';
  return (
    <Badge variant="outline" className={`font-medium ${cls}`}>
      {s}
    </Badge>
  );
}

// ---------- Confirm dialog (financial action safety) ----------
export function ConfirmActionDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  destructive = false,
  requireReason = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  requireReason?: boolean;
  onConfirm: (reason?: string) => Promise<void>;
}) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    if (requireReason && !reason.trim()) return;
    setBusy(true);
    try {
      await onConfirm(requireReason ? reason.trim() : undefined);
      onOpenChange(false);
      setReason('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!busy) { onOpenChange(o); if (!o) setReason(''); } }}>
      <DialogContent data-testid="confirm-dialog">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {requireReason && (
          <div className="space-y-2">
            <Label htmlFor="action-reason">Reason (required)</Label>
            <Textarea
              id="action-reason"
              data-testid="confirm-reason"
              placeholder="Enter the reason for this action..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button
            data-testid="confirm-action"
            onClick={handleConfirm}
            disabled={busy || (requireReason && !reason.trim())}
            className={destructive ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-emerald-600 text-white hover:bg-emerald-700'}
          >
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Pagination ----------
export function Pager({
  page,
  limit,
  total,
  onPageChange,
}: {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil((total || 0) / (limit || 20)));
  if (totalPages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between">
      <p className="text-xs text-slate-500">
        Page {page} of {totalPages} · {total} records
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="h-4 w-4" /> Prev
        </Button>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
