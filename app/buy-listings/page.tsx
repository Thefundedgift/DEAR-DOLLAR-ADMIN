'use client';

import { useState } from 'react';
import { AdminShell } from '@/components/admin/app-shell';
import { PageHeader, LoadingState, ErrorState, EmptyState, StatusBadge, Pager, ConfirmActionDialog } from '@/components/admin/shared';
import { useApi } from '@/hooks/use-api';
import { buyListingService, type BuyListingInput } from '@/services/listing.service';
import { apiErrorMessage } from '@/lib/api-client';
import { formatDateOnly, formatMoney, formatNumber } from '@/lib/format';
import type { BuyListing, ListingStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Play, Pause, XCircle, Loader2 } from 'lucide-react';

const LIMIT = 20;

const EMPTY_FORM: BuyListingInput = {
  title: '',
  description: '',
  moneyValue: 0,
  pointQuantity: 0,
  availableQuantity: 0,
  startDate: '',
  endDate: '',
  status: 'DRAFT' as ListingStatus,
};

function ListingFormDialog({
  open,
  onOpenChange,
  editing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: BuyListing | null;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<BuyListingInput>(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  // Sync form when dialog opens for a different record
  const currentKey = editing ? editing.id : 'new';
  if (open && loadedFor !== currentKey) {
    setLoadedFor(currentKey);
    setForm(
      editing
        ? {
            title: editing.title || '',
            description: editing.description || '',
            moneyValue: editing.moneyValue || 0,
            pointQuantity: editing.pointQuantity || 0,
            availableQuantity: editing.availableQuantity || 0,
            startDate: editing.startDate ? editing.startDate.slice(0, 10) : '',
            endDate: editing.endDate ? editing.endDate.slice(0, 10) : '',
            status: editing.status || 'DRAFT',
          }
        : EMPTY_FORM
    );
  }
  if (!open && loadedFor !== null) setLoadedFor(null);

  const set = (k: keyof BuyListingInput, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.title.trim() || !form.moneyValue || !form.pointQuantity) {
      toast.error('Title, Money Value and Point Quantity are required.');
      return;
    }
    setBusy(true);
    try {
      if (editing) {
        await buyListingService.update(editing.id, form);
        toast.success('Buy listing updated.');
      } else {
        await buyListingService.create(form);
        toast.success('Buy listing created.');
      }
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Buy Listing' : 'Create Buy Listing'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input data-testid="listing-title" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Festive $dollar pack" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Optional description shown to customers" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Money Value (₹)</Label>
              <Input data-testid="listing-money-value" type="number" min="0" value={form.moneyValue || ''} onChange={(e) => set('moneyValue', Number(e.target.value))} placeholder="40" />
            </div>
            <div className="space-y-2">
              <Label>Point Quantity ($dollar)</Label>
              <Input data-testid="listing-point-quantity" type="number" min="0" value={form.pointQuantity || ''} onChange={(e) => set('pointQuantity', Number(e.target.value))} placeholder="9" />
            </div>
          </div>
          {form.moneyValue > 0 && form.pointQuantity > 0 && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
              Rate: {formatMoney(form.moneyValue)} = {formatNumber(form.pointQuantity)} $dollar
            </p>
          )}
          <div className="space-y-2">
            <Label>Available Quantity</Label>
            <Input type="number" min="0" value={form.availableQuantity || ''} onChange={(e) => set('availableQuantity', Number(e.target.value))} placeholder="1000" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input type="date" value={form.startDate || ''} onChange={(e) => set('startDate', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input type="date" value={form.endDate || ''} onChange={(e) => set('endDate', e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => set('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="PAUSED">Paused</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={submit} disabled={busy} className="bg-emerald-600 text-white hover:bg-emerald-700" data-testid="listing-save">
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editing ? 'Save changes' : 'Create listing'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function BuyListingsPage() {
  const [status, setStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BuyListing | null>(null);
  const [statusAction, setStatusAction] = useState<{ type: 'activate' | 'pause' | 'close'; item: BuyListing } | null>(null);

  const { data, loading, error, refetch } = useApi(
    () => buyListingService.list({ status: status === 'ALL' ? undefined : status, page, limit: LIMIT }),
    [status, page]
  );

  const runStatusAction = async () => {
    if (!statusAction) return;
    try {
      await buyListingService[statusAction.type](statusAction.item.id);
      toast.success(`Listing ${statusAction.type}d.`);
      refetch();
    } catch (err) {
      toast.error(apiErrorMessage(err));
      throw err;
    }
  };

  return (
    <AdminShell permission="MANAGE_BUY_LISTINGS">
      <PageHeader
        title="Buy $dollar Listings"
        description="Offers where customers buy $dollar with money, e.g. ₹40 = 9 $dollar."
        actions={
          <>
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
              <SelectTrigger className="w-32 bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="PAUSED">Paused</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => { setEditing(null); setFormOpen(true); }} className="bg-emerald-600 text-white hover:bg-emerald-700" data-testid="create-buy-listing">
              <Plus className="mr-1.5 h-4 w-4" /> New Listing
            </Button>
          </>
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
                    <TableHead>Title</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium">{l.title}</TableCell>
                      <TableCell className="whitespace-nowrap">{formatMoney(l.moneyValue)} = {formatNumber(l.pointQuantity)} $D</TableCell>
                      <TableCell>{formatNumber(l.availableQuantity)}</TableCell>
                      <TableCell className="text-slate-500">{formatDateOnly(l.startDate)}</TableCell>
                      <TableCell className="text-slate-500">{formatDateOnly(l.endDate)}</TableCell>
                      <TableCell><StatusBadge status={l.status} /></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => { setEditing(l); setFormOpen(true); }} data-testid={`edit-listing-${l.id}`}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          {l.status !== 'ACTIVE' && l.status !== 'CLOSED' && (
                            <Button size="sm" variant="ghost" className="text-emerald-600" onClick={() => setStatusAction({ type: 'activate', item: l })} title="Activate">
                              <Play className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {l.status === 'ACTIVE' && (
                            <Button size="sm" variant="ghost" className="text-amber-600" onClick={() => setStatusAction({ type: 'pause', item: l })} title="Pause">
                              <Pause className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {l.status !== 'CLOSED' && (
                            <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setStatusAction({ type: 'close', item: l })} title="Close">
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState message="No buy listings yet. Create your first listing." />
          )}
          <Pager page={page} limit={LIMIT} total={data.total || 0} onPageChange={setPage} />
        </>
      )}

      <ListingFormDialog open={formOpen} onOpenChange={setFormOpen} editing={editing} onSaved={refetch} />

      <ConfirmActionDialog
        open={!!statusAction}
        onOpenChange={(o) => !o && setStatusAction(null)}
        title={`${statusAction ? statusAction.type.charAt(0).toUpperCase() + statusAction.type.slice(1) : ''} listing?`}
        description={statusAction ? `This will ${statusAction.type} "${statusAction.item.title}". The backend validates the state change.` : ''}
        confirmLabel={statusAction ? statusAction.type.charAt(0).toUpperCase() + statusAction.type.slice(1) : ''}
        destructive={statusAction?.type === 'close'}
        onConfirm={runStatusAction}
      />
    </AdminShell>
  );
}
