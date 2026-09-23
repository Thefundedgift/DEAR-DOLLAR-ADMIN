'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin/app-shell';
import { PageHeader, LoadingState, ErrorState, StatusBadge, ConfirmActionDialog } from '@/components/admin/shared';
import { useApi } from '@/hooks/use-api';
import { paymentSettingsService } from '@/services/payment.service';
import { apiErrorMessage } from '@/lib/api-client';
import { formatDate } from '@/lib/format';
import type { PaymentSettings } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Save, History } from 'lucide-react';

const EMPTY: PaymentSettings = { upiId: '', merchantName: '', qrImageUrl: '', instructions: '', enabled: true };

export default function PaymentSettingsPage() {
  const current = useApi(() => paymentSettingsService.getCurrent(), []);
  const history = useApi(() => paymentSettingsService.getHistory(), []);

  const [form, setForm] = useState<PaymentSettings>(EMPTY);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (current.data) {
      setForm({
        upiId: current.data.upiId || '',
        merchantName: current.data.merchantName || '',
        qrImageUrl: current.data.qrImageUrl || '',
        instructions: current.data.instructions || '',
        enabled: current.data.enabled ?? true,
      });
    }
  }, [current.data]);

  const set = (k: keyof PaymentSettings, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    try {
      await paymentSettingsService.update(form);
      toast.success('Payment settings saved. Previous configuration preserved in history; change audit-logged.');
      current.refetch();
      history.refetch();
    } catch (err) {
      toast.error(apiErrorMessage(err));
      throw err;
    }
  };

  return (
    <AdminShell permission="MANAGE_PAYMENT_SETTINGS" superAdminOnly>
      <PageHeader
        title="Payment Settings"
        description="Super Admin only. Changing settings creates a new configuration version — old payment records are never modified."
      />

      {current.loading && <LoadingState />}
      {!current.loading && current.error && <ErrorState message={current.error} onRetry={current.refetch} />}
      {!current.loading && !current.error && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Current UPI Configuration</CardTitle>
              <CardDescription>Used by customers when depositing money.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>UPI ID</Label>
                <Input data-testid="settings-upi-id" value={form.upiId} onChange={(e) => set('upiId', e.target.value)} placeholder="merchant@upi" />
              </div>
              <div className="space-y-2">
                <Label>Merchant Name</Label>
                <Input data-testid="settings-merchant-name" value={form.merchantName} onChange={(e) => set('merchantName', e.target.value)} placeholder="DEAR DOLLAR" />
              </div>
              <div className="space-y-2">
                <Label>QR Image URL</Label>
                <Input value={form.qrImageUrl || ''} onChange={(e) => set('qrImageUrl', e.target.value)} placeholder="https://... (uploaded QR image)" />
                {form.qrImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.qrImageUrl} alt="UPI QR preview" className="mt-2 h-36 w-36 rounded-lg border border-slate-200 object-contain" />
                ) : null}
              </div>
              <div className="space-y-2">
                <Label>Payment Instructions</Label>
                <Textarea value={form.instructions || ''} onChange={(e) => set('instructions', e.target.value)} placeholder="Instructions shown to customers during payment" />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                <div>
                  <p className="text-sm font-medium">Payments enabled</p>
                  <p className="text-xs text-slate-500">Disable to temporarily stop accepting deposits.</p>
                </div>
                <Switch checked={form.enabled} onCheckedChange={(v) => set('enabled', v)} data-testid="settings-enabled" />
              </div>
              <Button onClick={() => setConfirmOpen(true)} className="w-full bg-emerald-600 text-white hover:bg-emerald-700" data-testid="save-payment-settings">
                <Save className="mr-2 h-4 w-4" /> Save configuration
              </Button>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="h-4 w-4 text-slate-500" /> Configuration History
              </CardTitle>
              <CardDescription>All previous configurations are preserved.</CardDescription>
            </CardHeader>
            <CardContent>
              {history.loading ? (
                <p className="text-sm text-slate-500">Loading history...</p>
              ) : history.error ? (
                <p className="text-sm text-red-600">{history.error}</p>
              ) : history.data?.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>UPI ID</TableHead>
                      <TableHead>Merchant</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Changed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.data.map((h, i) => (
                      <TableRow key={h.id || i}>
                        <TableCell className="font-mono text-xs">{h.upiId}</TableCell>
                        <TableCell>{h.merchantName}</TableCell>
                        <TableCell><StatusBadge status={h.enabled ? 'ENABLED' : 'DISABLED'} /></TableCell>
                        <TableCell className="text-slate-500">{formatDate(h.updatedAt || h.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-slate-500">No configuration history yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <ConfirmActionDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Save payment settings?"
        description="A new configuration version will be created. Old payment records remain untouched and the change is written to the audit log."
        confirmLabel="Save configuration"
        onConfirm={save}
      />
    </AdminShell>
  );
}
