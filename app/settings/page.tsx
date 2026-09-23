'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin/app-shell';
import { PageHeader, LoadingState, ErrorState, ConfirmActionDialog } from '@/components/admin/shared';
import { useApi } from '@/hooks/use-api';
import { settingsService } from '@/services/settings.service';
import { apiErrorMessage } from '@/lib/api-client';
import type { SocialLinks } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Save, Send, MessageSquare } from 'lucide-react';

const EMPTY: SocialLinks = { telegramUrl: '', telegramEnabled: false, discordUrl: '', discordEnabled: false };

export default function SettingsPage() {
  const current = useApi(() => settingsService.getSocialLinks(), []);
  const [form, setForm] = useState<SocialLinks>(EMPTY);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (current.data) {
      setForm({
        telegramUrl: current.data.telegramUrl || '',
        telegramEnabled: current.data.telegramEnabled ?? false,
        discordUrl: current.data.discordUrl || '',
        discordEnabled: current.data.discordEnabled ?? false,
      });
    }
  }, [current.data]);

  const save = async () => {
    try {
      await settingsService.updateSocialLinks(form);
      toast.success('Social links saved. The change has been recorded in the audit log.');
      current.refetch();
    } catch (err) {
      toast.error(apiErrorMessage(err));
      throw err;
    }
  };

  return (
    <AdminShell superAdminOnly>
      <PageHeader
        title="Social / Community Links"
        description="Super Admin only. Configure the Telegram and Discord links shown to customers. Stored in the backend, never hardcoded."
      />

      {current.loading && <LoadingState />}
      {!current.loading && current.error && <ErrorState message={current.error} onRetry={current.refetch} />}
      {!current.loading && !current.error && (
        <div className="grid max-w-4xl gap-6 md:grid-cols-2">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Send className="h-4 w-4 text-sky-500" /> Telegram
              </CardTitle>
              <CardDescription>Community channel link for customers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Telegram URL</Label>
                <Input
                  data-testid="telegram-url"
                  placeholder="https://t.me/yourchannel"
                  value={form.telegramUrl || ''}
                  onChange={(e) => setForm((f) => ({ ...f, telegramUrl: e.target.value }))}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                <div>
                  <p className="text-sm font-medium">Enabled</p>
                  <p className="text-xs text-slate-500">Show this link to customers.</p>
                </div>
                <Switch checked={form.telegramEnabled} onCheckedChange={(v) => setForm((f) => ({ ...f, telegramEnabled: v }))} data-testid="telegram-enabled" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-4 w-4 text-indigo-500" /> Discord
              </CardTitle>
              <CardDescription>Community server invite for customers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Discord URL</Label>
                <Input
                  data-testid="discord-url"
                  placeholder="https://discord.gg/yourserver"
                  value={form.discordUrl || ''}
                  onChange={(e) => setForm((f) => ({ ...f, discordUrl: e.target.value }))}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                <div>
                  <p className="text-sm font-medium">Enabled</p>
                  <p className="text-xs text-slate-500">Show this link to customers.</p>
                </div>
                <Switch checked={form.discordEnabled} onCheckedChange={(v) => setForm((f) => ({ ...f, discordEnabled: v }))} data-testid="discord-enabled" />
              </div>
            </CardContent>
          </Card>

          <div className="md:col-span-2">
            <Button onClick={() => setConfirmOpen(true)} className="bg-emerald-600 text-white hover:bg-emerald-700" data-testid="save-social-links">
              <Save className="mr-2 h-4 w-4" /> Save social links
            </Button>
          </div>
        </div>
      )}

      <ConfirmActionDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Save social links?"
        description="The updated links will be stored in the backend and the change will be written to the audit log."
        confirmLabel="Save links"
        onConfirm={save}
      />
    </AdminShell>
  );
}
