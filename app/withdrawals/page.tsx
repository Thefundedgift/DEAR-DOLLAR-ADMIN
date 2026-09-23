'use client';

import { useState } from 'react';
import { AdminShell } from '@/components/admin/app-shell';
import { PageHeader, LoadingState, ErrorState, EmptyState, StatusBadge, Pager, ConfirmActionDialog } from '@/components/admin/shared';
import { useApi } from '@/hooks/use-api';
import { customerService } from '@/services/customer.service';
import { apiErrorMessage } from '@/lib/api-client';
import { formatDate, formatMoney } from '@/lib/format';
import type { Withdrawal } from '@/types';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Check, X } from 'lucide-react';

const LIMIT = 20;

export default function WithdrawalsPage() {
  const [status, setStatus] = useState('PENDING');
  const [page, setPage] = useState(1);
  const [action, setAction] = useState<{ type: 'approve' | 'reject'; item: Withdrawal } | null>(null);

  const { data, loading, error, refetch } = useApi(
    () => customerService.listWithdrawals({ status: status === 'ALL' ? undefined : status, page, limit: LIMIT }),
    [status, page]
  );

  const runAction = async (reason?: string) => {
    if (!action) return;
    try {
      if (action.type === 'approve') {
        await customerService.approveWithdrawal(action.item.id);
        toast.success('Withdrawal approved. Backend has processed the wallet debit.');
      } else {
        await customerService.rejectWithdrawal(action.item.id, reason || '');
        toast.success('Withdrawal rejected.');
      }
      refetch();
    } catch (err) {
      toast.error(apiErrorMessage(err));
      throw err;
    }
  };

  return (
    <AdminShell permission="VIEW_WALLETS">
      <PageHeader
        title="Money Withdrawals"
        description="Review and approve customer money withdrawal requests. Final validation happens on the backend."
        actions={
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-40 bg-white" data-testid="withdrawal-status-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
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
                    <TableHead>Amount</TableHead>
                    <TableHead>Bank / UPI</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((w) => (
                    <TableRow key={w.id}>
                      <TableCell className="font-medium">
                        {w.customer?.name || w.customerId || '\u2014'}
                        <p className="text-xs text-slate-500">{w.customer?.mobile}</p>
                      </TableCell>
                      <TableCell className="font-semibold">{formatMoney(w.amount)}</TableCell>
                      <TableCell className="text-slate-500">
                        {w.bankDetails?.upiId || w.bankDetails?.accountNumber || '\u2014'}
                      </TableCell>
                      <TableCell className="text-slate-500">{formatDate(w.createdAt)}</TableCell>
                      <TableCell><StatusBadge status={w.status} /></TableCell>
                      <TableCell className="text-right">
                        {String(w.status).toUpperCase() === 'PENDING' && (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              className="bg-emerald-600 text-white hover:bg-emerald-700"
                              onClick={() => setAction({ type: 'approve', item: w })}
                              data-testid={`approve-withdrawal-${w.id}`}
                            >
                              <Check className="mr-1 h-3.5 w-3.5" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-200 text-red-600 hover:bg-red-50"
                              onClick={() => setAction({ type: 'reject', item: w })}
                              data-testid={`reject-withdrawal-${w.id}`}
                            >
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
            <EmptyState message="No withdrawal requests found." />
          )}
          <Pager page={page} limit={LIMIT} total={data.total || 0} onPageChange={setPage} />
        </>
      )}

      <ConfirmActionDialog
        open={!!action}
        onOpenChange={(o) => !o && setAction(null)}
        title={action?.type === 'approve' ? 'Approve withdrawal?' : 'Reject withdrawal?'}
        description={
          action
            ? `${action.type === 'approve' ? 'Approve' : 'Reject'} withdrawal of ${formatMoney(action.item.amount)} for ${
                action.item.customer?.name || 'customer'
              }. This financial action is executed and validated by the backend and will be audit-logged.`
            : ''
        }
        confirmLabel={action?.type === 'approve' ? 'Approve withdrawal' : 'Reject withdrawal'}
        destructive={action?.type === 'reject'}
        requireReason={action?.type === 'reject'}
        onConfirm={runAction}
      />
    </AdminShell>
  );
}
