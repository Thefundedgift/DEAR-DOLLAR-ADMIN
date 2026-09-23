'use client';

import { useState } from 'react';
import { AdminShell } from '@/components/admin/app-shell';
import { PageHeader, LoadingState, ErrorState, EmptyState, StatusBadge, Pager, ConfirmActionDialog } from '@/components/admin/shared';
import { useApi } from '@/hooks/use-api';
import { paymentService } from '@/services/payment.service';
import { apiErrorMessage } from '@/lib/api-client';
import { formatDate, formatMoney } from '@/lib/format';
import type { Payment } from '@/types';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { BadgeCheck, X } from 'lucide-react';

const LIMIT = 20;

export default function PaymentsPage() {
  const [status, setStatus] = useState('PENDING');
  const [page, setPage] = useState(1);
  const [action, setAction] = useState<{ type: 'verify' | 'reject'; item: Payment } | null>(null);

  const { data, loading, error, refetch } = useApi(
    () => paymentService.list({ status: status === 'ALL' ? undefined : status, page, limit: LIMIT }),
    [status, page]
  );

  const runAction = async (reason?: string) => {
    if (!action) return;
    try {
      if (action.type === 'verify') {
        await paymentService.verify(action.item.id);
        toast.success('Payment verified. Only the backend credits the Money Wallet.');
      } else {
        await paymentService.reject(action.item.id, reason || '');
        toast.success('Payment rejected.');
      }
      refetch();
    } catch (err) {
      toast.error(apiErrorMessage(err));
      throw err;
    }
  };

  return (
    <AdminShell permission="VERIFY_PAYMENTS">
      <PageHeader
        title="Payment Verification"
        description="Pending UPI payments awaiting manual verification. Verifying credits the customer's Money Wallet via the backend only."
        actions={
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-40 bg-white" data-testid="payment-status-filter"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="VERIFIED">Verified</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="ALL">All</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {loading && <LoadingState />}
      {!loading && error && <ErrorState message={error} onRetry={refetch} />}
      {!loading && !error && data && (
        <>
          {data.items?.length ? (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Payment ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>UTR</TableHead>
                    <TableHead>UPI ID Used</TableHead>
                    <TableHead>Payment Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">
                        {p.customer?.name || '—'}
                        <p className="text-xs text-slate-500">{p.customer?.mobile}</p>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{p.paymentId || p.id}</TableCell>
                      <TableCell className="font-semibold">{formatMoney(p.amount)}</TableCell>
                      <TableCell className="font-mono text-xs">{p.utr || '—'}</TableCell>
                      <TableCell>{p.upiId || '—'}</TableCell>
                      <TableCell className="text-slate-500">{formatDate(p.paidAt || p.createdAt)}</TableCell>
                      <TableCell><StatusBadge status={p.status} /></TableCell>
                      <TableCell className="text-right">
                        {String(p.status).toUpperCase() === 'PENDING' && (
                          <div className="flex justify-end gap-2">
                            <Button size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => setAction({ type: 'verify', item: p })} data-testid={`verify-payment-${p.id}`}>
                              <BadgeCheck className="mr-1 h-3.5 w-3.5" /> Verify
                            </Button>
                            <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => setAction({ type: 'reject', item: p })} data-testid={`reject-payment-${p.id}`}>
                              <X className="mr-1 h-3.5 w-3.5" /> Reject
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState message="No payments found." />
          )}
          <Pager page={page} limit={LIMIT} total={data.total || 0} onPageChange={setPage} />
        </>
      )}

      <ConfirmActionDialog
        open={!!action}
        onOpenChange={(o) => !o && setAction(null)}
        title={action?.type === 'verify' ? 'Verify payment?' : 'Reject payment?'}
        description={
          action
            ? action.type === 'verify'
              ? `Confirm that you verified UTR ${action.item.utr || '—'} for ${formatMoney(action.item.amount)}. Only the backend will credit the customer's Money Wallet. This action is audit-logged.`
              : `Reject payment of ${formatMoney(action.item.amount)} (UTR: ${action.item.utr || '—'}). No wallet will be credited.`
            : ''
        }
        confirmLabel={action?.type === 'verify' ? 'Verify & credit' : 'Reject payment'}
        destructive={action?.type === 'reject'}
        requireReason={action?.type === 'reject'}
        onConfirm={runAction}
      />
    </AdminShell>
  );
}
