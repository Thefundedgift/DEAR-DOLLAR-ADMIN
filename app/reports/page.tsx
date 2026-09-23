'use client';

import { useState } from 'react';
import { AdminShell } from '@/components/admin/app-shell';
import { PageHeader, LoadingState, ErrorState, EmptyState, Pager } from '@/components/admin/shared';
import { useApi } from '@/hooks/use-api';
import { reportService } from '@/services/report.service';
import { apiErrorMessage } from '@/lib/api-client';
import type { ReportType } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Download, Filter, Loader2 } from 'lucide-react';

const LIMIT = 25;

const REPORT_TYPES: { value: ReportType; label: string }[] = [
  { value: 'deposits', label: 'Deposits' },
  { value: 'buy-transactions', label: 'Buy Transactions' },
  { value: 'sell-transactions', label: 'Sell Transactions' },
  { value: 'dollar-volume', label: '$dollar Volume' },
  { value: 'wallet-transactions', label: 'Wallet Transactions' },
  { value: 'payment-verifications', label: 'Payment Verification' },
  { value: 'pending-transactions', label: 'Pending Transactions' },
  { value: 'admin-activity', label: 'Admin Activity' },
];

function formatCell(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  const s = String(value);
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  }
  return s;
}

export default function ReportsPage() {
  const [type, setType] = useState<ReportType>('deposits');
  const [filters, setFilters] = useState({ from: '', to: '', customerId: '', status: '', type: '' });
  const [applied, setApplied] = useState(filters);
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  const activeFilters = () => ({
    from: applied.from || undefined,
    to: applied.to || undefined,
    customerId: applied.customerId || undefined,
    status: applied.status || undefined,
    type: applied.type || undefined,
  });

  const { data, loading, error, refetch } = useApi(
    () => reportService.get(type, { ...activeFilters(), page, limit: LIMIT }),
    [type, applied, page]
  );

  const apply = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setApplied(filters);
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const blob = await reportService.exportCsv(type, activeFilters());
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-report.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setExporting(false);
    }
  };

  const columns = data?.items?.length ? Object.keys(data.items[0]) : [];

  return (
    <AdminShell permission="VIEW_REPORTS">
      <PageHeader
        title="Reports"
        description="Generate operational and financial reports from the backend with filters."
        actions={
          <Button onClick={exportCsv} disabled={exporting} variant="outline" className="bg-white" data-testid="export-csv">
            {exporting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Download className="mr-1.5 h-4 w-4" />}
            Export CSV
          </Button>
        }
      />

      <form onSubmit={apply} className="mb-4 grid grid-cols-2 items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-3 lg:grid-cols-6">
        <div className="space-y-1.5">
          <Label className="text-xs">Report</Label>
          <Select value={type} onValueChange={(v) => { setType(v as ReportType); setPage(1); }}>
            <SelectTrigger data-testid="report-type"><SelectValue /></SelectTrigger>
            <SelectContent>
              {REPORT_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">From</Label>
          <Input type="date" value={filters.from} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">To</Label>
          <Input type="date" value={filters.to} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Customer ID</Label>
          <Input placeholder="Optional" value={filters.customerId} onChange={(e) => setFilters((f) => ({ ...f, customerId: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Status</Label>
          <Input placeholder="e.g. PENDING" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))} />
        </div>
        <Button type="submit" variant="outline">
          <Filter className="mr-1.5 h-3.5 w-3.5" /> Apply
        </Button>
      </form>

      {loading && <LoadingState />}
      {!loading && error && <ErrorState message={error} onRetry={refetch} />}
      {!loading && !error && data && (
        <>
          {data.items?.length ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((c) => (
                      <TableHead key={c} className="whitespace-nowrap capitalize">{c.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((row, i) => (
                    <TableRow key={(row.id as string) || i}>
                      {columns.map((c) => (
                        <TableCell key={c} className="whitespace-nowrap text-sm">{formatCell(row[c])}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState message="No report data for the selected filters." />
          )}
          <Pager page={page} limit={LIMIT} total={data.total || 0} onPageChange={setPage} />
        </>
      )}
    </AdminShell>
  );
}
