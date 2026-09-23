'use client';

import { useState } from 'react';
import { AdminShell } from '@/components/admin/app-shell';
import { PageHeader, LoadingState, ErrorState, EmptyState, StatusBadge, Pager, ConfirmActionDialog } from '@/components/admin/shared';
import { useApi } from '@/hooks/use-api';
import { sellRequestService } from '@/services/request.service';
import { apiErrorMessage } from '@/lib/api-client';
import { formatDate, formatMoney, formatDollar } from '@/lib/format';
import type { SellRequest } from '@/types';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Check, X } from 'lucide-react';

const LIMIT = 20;

export default function SellRequestsPage() {
  const [status, setStatus] = useState('PENDING');
  const [page, setPage] = useState(1);
  const [action, setAction] = useState<{ type: 'approve' | 'reject'; item: SellRequest } | null>(null);

  const { data, loading, error, refetch } = useApi(
    () => sellRequestService.list({ status: status === 'ALL' ? undefined : status, page, limit: LIMIT }),
    [status, page]
  );

  const runAction = async (reason?: string) => {
    if (!action) return;
    try {
      if (action.type === 'approve') {
        await sellRequestService.approve(action.item.id);
        toast.success('Sell request approved. The backend has performed the final validation and payout.');
      } else {
        await sellRequestService.reject(action.item.id, reason || '');
        toast.success('Sell request rejected.');
      }
      refetch();
    } catch (err) {
      toast.error(apiErrorMessage(err));
      throw err;
    }
  };

  return (
    <AdminShell permission="APPROVE_SELL">
      <PageHeader
        title="Sell Approvals"
        description="Pending customer requests to sell $dollar back against demand listings."
        actions={
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-40 bg-white" data-testid="sell-request-status-filter"><SelectValue /></SelectTrigger>
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
                    <TableHead>$dollar</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Expected Amount</TableHead>
                    <TableHead>Demand Listing</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">
                        {r.customer?.name || '—'}
                        <p className="text-xs text-slate-500">{r.customer?.mobile}</p>
                      </TableCell>
                      <TableCell>{formatDollar(r.dollarQuantity)}</TableCell>
                      <TableCell>{formatMoney(r.rate)}</TableCell>
                      <TableCell className="font-semibold">{formatMoney(r.expectedAmount)}</TableCell>
                      <TableCell className="text-slate-500">{r.demandListing?.title || '—'}</TableCell>
                      <TableCell className="text-slate-500">{formatDate(r.createdAt)}</TableCell>
                      <TableCell><StatusBadge status={r.status} /></TableCell>
                      <TableCell className="text-right">
                        {String(r.status).toUpperCase() === 'PENDING' && (
                          <div className="flex justify-end gap-2">
                            <Button size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => setAction({ type: 'approve', item: r })} data-testid={`approve-sell-${r.id}`}>
                              <Check className="mr-1 h-3.5 w-3.5" /> Approve
                            </Button>
                            <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => setAction({ type: 'reject', item: r })} data-testid={`reject-sell-${r.id}`}>
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
            <EmptyState message="No sell requests found." />
          )}
          <Pager page={page} limit={LIMIT} total={data.total || 0} onPageChange={setPage} />
        </>
      )}

      <ConfirmActionDialog
        open={!!action}
        onOpenChange={(o) => !o && setAction(null)}
        title={action?.type === 'approve' ? 'Approve sell request?' : 'Reject sell request?'}
        description={
          action
            ? `${action.type === 'approve' ? 'Approve' : 'Reject'} sale of ${formatDollar(action.item.dollarQuantity)} for ${formatMoney(action.item.expectedAmount)} by ${action.item.customer?.name || 'customer'}. The backend performs the final validation — this panel never modifies wallets directly.`
            : ''
        }
        confirmLabel={action?.type === 'approve' ? 'Approve' : 'Reject'}
        destructive={action?.type === 'reject'}
        requireReason={action?.type === 'reject'}
        onConfirm={runAction}
      />
    </AdminShell>
  );
}
