'use client';

import { useState } from 'react';
import { AdminShell } from '@/components/admin/app-shell';
import { PageHeader, LoadingState, ErrorState, EmptyState, StatusBadge, Pager, ConfirmActionDialog } from '@/components/admin/shared';
import { useApi } from '@/hooks/use-api';
import { adminService, type CreateAdminInput } from '@/services/admin.service';
import { apiErrorMessage } from '@/lib/api-client';
import { formatDate } from '@/lib/format';
import { ALL_PERMISSIONS, type AdminProfile, type Permission } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Ban, CheckCircle2, Loader2 } from 'lucide-react';

const LIMIT = 20;

const EMPTY: CreateAdminInput = {
  name: '',
  email: '',
  mobile: '',
  password: '',
  role: 'ADMIN',
  permissions: [],
  status: 'ACTIVE',
};

function AdminFormDialog({
  open,
  onOpenChange,
  editing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: AdminProfile | null;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<CreateAdminInput>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  const currentKey = editing ? editing.id : 'new';
  if (open && loadedFor !== currentKey) {
    setLoadedFor(currentKey);
    setForm(
      editing
        ? {
            name: editing.name || '',
            email: editing.email || '',
            mobile: editing.mobile || '',
            password: '',
            role: editing.role || 'ADMIN',
            permissions: editing.permissions || [],
            status: editing.status || 'ACTIVE',
          }
        : EMPTY
    );
  }
  if (!open && loadedFor !== null) setLoadedFor(null);

  const togglePermission = (p: Permission) =>
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(p) ? f.permissions.filter((x) => x !== p) : [...f.permissions, p],
    }));

  const submit = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Name and Email are required.');
      return;
    }
    if (!editing && !form.password) {
      toast.error('Password is required for a new admin.');
      return;
    }
    setBusy(true);
    try {
      if (editing) {
        const payload: Partial<CreateAdminInput> = { ...form };
        if (!form.password) delete (payload as Record<string, unknown>).password;
        await adminService.update(editing.id, payload);
        toast.success('Admin updated.');
      } else {
        await adminService.create(form);
        toast.success('Admin created. Password is hashed by the backend (Argon2id/bcrypt) — never stored in plaintext.');
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
          <DialogTitle>{editing ? 'Edit Admin' : 'Create Admin'}</DialogTitle>
          <DialogDescription>
            Passwords are hashed on the backend. Role and permissions are enforced server-side on every API call.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input data-testid="admin-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Mobile (optional)</Label>
              <Input value={form.mobile || ''} onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input data-testid="admin-email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>{editing ? 'New Password (leave blank to keep current)' : 'Password'}</Label>
            <Input data-testid="admin-password" type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v as CreateAdminInput['role'] }))}>
                <SelectTrigger data-testid="admin-role"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as CreateAdminInput['status'] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="DISABLED">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {form.role !== 'SUPER_ADMIN' && (
            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="grid grid-cols-1 gap-2 rounded-lg border border-slate-200 p-3 sm:grid-cols-2">
                {ALL_PERMISSIONS.map((p) => (
                  <label key={p} className="flex items-center gap-2 text-sm">
                    <Checkbox checked={form.permissions.includes(p)} onCheckedChange={() => togglePermission(p)} data-testid={`perm-${p}`} />
                    <span className="text-slate-700">{p.replaceAll('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          {form.role === 'SUPER_ADMIN' && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Super Admins automatically have all permissions.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={submit} disabled={busy} className="bg-emerald-600 text-white hover:bg-emerald-700" data-testid="admin-save">
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editing ? 'Save changes' : 'Create admin'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminsPage() {
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProfile | null>(null);
  const [toggleTarget, setToggleTarget] = useState<AdminProfile | null>(null);

  const { data, loading, error, refetch } = useApi(() => adminService.list({ page, limit: LIMIT }), [page]);

  const runToggle = async () => {
    if (!toggleTarget) return;
    try {
      if (toggleTarget.status === 'ACTIVE') {
        await adminService.disable(toggleTarget.id);
        toast.success('Admin disabled.');
      } else {
        await adminService.enable(toggleTarget.id);
        toast.success('Admin enabled.');
      }
      refetch();
    } catch (err) {
      toast.error(apiErrorMessage(err));
      throw err;
    }
  };

  return (
    <AdminShell permission="MANAGE_ADMINS" superAdminOnly>
      <PageHeader
        title="Admin Management"
        description="Super Admin only. Create admins, assign roles and granular permissions."
        actions={
          <Button onClick={() => { setEditing(null); setFormOpen(true); }} className="bg-emerald-600 text-white hover:bg-emerald-700" data-testid="create-admin">
            <Plus className="mr-1.5 h-4 w-4" /> New Admin
          </Button>
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
                    <TableHead>Name</TableHead>
                    <TableHead>Email / Mobile</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.name}</TableCell>
                      <TableCell>
                        {a.email}
                        {a.mobile && <p className="text-xs text-slate-500">{a.mobile}</p>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={a.role === 'SUPER_ADMIN' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-700'}>
                          {a.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        {a.role === 'SUPER_ADMIN' ? (
                          <span className="text-xs text-slate-500">All permissions</span>
                        ) : (
                          <span className="text-xs text-slate-500">{(a.permissions || []).length} permission(s)</span>
                        )}
                      </TableCell>
                      <TableCell><StatusBadge status={a.status} /></TableCell>
                      <TableCell className="text-slate-500">{formatDate(a.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => { setEditing(a); setFormOpen(true); }} data-testid={`edit-admin-${a.id}`}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          {a.status === 'ACTIVE' ? (
                            <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setToggleTarget(a)} title="Disable" data-testid={`disable-admin-${a.id}`}>
                              <Ban className="h-3.5 w-3.5" />
                            </Button>
                          ) : (
                            <Button size="sm" variant="ghost" className="text-emerald-600" onClick={() => setToggleTarget(a)} title="Enable">
                              <CheckCircle2 className="h-3.5 w-3.5" />
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
            <EmptyState message="No admins found." />
          )}
          <Pager page={page} limit={LIMIT} total={data.total || 0} onPageChange={setPage} />
        </>
      )}

      <AdminFormDialog open={formOpen} onOpenChange={setFormOpen} editing={editing} onSaved={refetch} />

      <ConfirmActionDialog
        open={!!toggleTarget}
        onOpenChange={(o) => !o && setToggleTarget(null)}
        title={toggleTarget?.status === 'ACTIVE' ? 'Disable admin?' : 'Enable admin?'}
        description={
          toggleTarget
            ? toggleTarget.status === 'ACTIVE'
              ? `${toggleTarget.name} will lose access immediately and their refresh tokens will be revoked by the backend.`
              : `${toggleTarget.name} will regain access to the admin panel.`
            : ''
        }
        confirmLabel={toggleTarget?.status === 'ACTIVE' ? 'Disable' : 'Enable'}
        destructive={toggleTarget?.status === 'ACTIVE'}
        onConfirm={runToggle}
      />
    </AdminShell>
  );
}
