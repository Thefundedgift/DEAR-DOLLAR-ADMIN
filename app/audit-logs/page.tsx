'use client';

import { useState } from 'react';
import { AdminShell } from '@/components/admin/app-shell';
import { PageHeader, LoadingState, ErrorState, EmptyState, Pager } from '@/components/admin/shared';
import { useApi } from '@/hooks/use-api';
import { auditService } from '@/services/audit.service';
import { formatDate } from '@/lib/format';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { AuditLog } from '@/types';
import { Filter, Eye } from 'lucide-react';

const LIMIT = 25;

function ValueBlock({ label, value }: { label: string; value: AuditLog['oldValue'] }) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <pre className="max-h-48 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-emerald-300">
        {value ? (typeof value === 'string' ? value : JSON.stringify(value, null, 2)) : '—'}
      </pre>
    </div>
  );
}

export default function AuditLogsPage() {
  const [filters, setFilters] = useState({ action: '', entity: '', from: '', to: '' });
  const [applied, setApplied] = useState(filters);
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<AuditLog | null>(null);

  const { data, loading, error, refetch } = useApi(
    () =>
      auditService.list({
        action: applied.action || undefined,
        entity: applied.entity || undefined,
        from: applied.from || undefined,
        to: applied.to || undefined,
        page,
        limit: LIMIT,
      }),
    [applied, page]
  );

  const apply = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setApplied(filters);
  };

  return (
    <AdminShell permission="VIEW_AUDIT_LOGS">
      <PageHeader
        title="Audit Logs"
        description="Every sensitive admin action is recorded by the backend: UPI changes, approvals, verifications, admin changes and more."
      />

      <form onSubmit={apply} className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
        <Input placeholder="Action (e.g. BUY_APPROVED)" value={filters.action} onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value }))} className="bg-white" />
        <Input placeholder="Entity (e.g. PAYMENT)" value={filters.entity} onChange={(e) => setFilters((f) => ({ ...f, entity: e.target.value }))} className="bg-white" />
        <Input type="date" value={filters.from} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))} className="bg-white" />
        <Input type="date" value={filters.to} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))} className="bg-white" />
        <Button type="submit" variant="outline" className="bg-white" data-testid="audit-apply-filters">
          <Filter className="mr-1.5 h-3.5 w-3.5" /> Apply
        </Button>
      </form>

      {loading && <LoadingState />}
      {!loading && error && <ErrorState message={error} onRetry={refetch} />}
      {!loading && !error && data && (
        <>
          {data.items?.length ? (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Admin</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Entity ID</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead className="text-right">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">
                        {log.admin?.name || '—'}
                        <p className="text-xs text-slate-500">{log.admin?.email}</p>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="border-slate-200 bg-slate-50 font-mono text-xs">{log.action}</Badge></TableCell>
                      <TableCell>{log.entity}</TableCell>
                      <TableCell className="font-mono text-xs text-slate-500">{log.entityId || '—'}</TableCell>
                      <TableCell className="font-mono text-xs text-slate-500">{log.ip || '—'}</TableCell>
                      <TableCell className="text-slate-500">{formatDate(log.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => setDetail(log)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState message="No audit logs found for the selected filters." />
          )}
          <Pager page={page} limit={LIMIT} total={data.total || 0} onPageChange={setPage} />
        </>
      )}

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Audit entry — {detail?.action}</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <p><span className="text-slate-500">Admin:</span> {detail.admin?.name || '—'}</p>
                <p><span className="text-slate-500">Entity:</span> {detail.entity} {detail.entityId ? `#${detail.entityId}` : ''}</p>
                <p><span className="text-slate-500">IP:</span> {detail.ip || '—'}</p>
                <p><span className="text-slate-500">Time:</span> {formatDate(detail.createdAt)}</p>
              </div>
              <ValueBlock label="Old Value" value={detail.oldValue} />
              <ValueBlock label="New Value" value={detail.newValue} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
