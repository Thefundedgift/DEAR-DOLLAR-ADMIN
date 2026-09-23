'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { AdminShell } from '@/components/admin/app-shell';
import { PageHeader, LoadingState, ErrorState, EmptyState, StatusBadge, Pager } from '@/components/admin/shared';
import { useApi } from '@/hooks/use-api';
import { useAuth } from '@/hooks/use-auth';
import { customerService } from '@/services/customer.service';
import { apiErrorMessage } from '@/lib/api-client';
import { formatDate, formatMoney, formatDollar } from '@/lib/format';
import type { BankDetails } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Wallet, Coins, Landmark, Loader2, ShieldAlert } from 'lucide-react';

const LIMIT = 20;

function DetailRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 py-2 text-sm last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900">{value ?? '\u2014'}</span>
    </div>
  );
}

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const { can } = useAuth();
  const [txPage, setTxPage] = useState(1);

  const profile = useApi(() => customerService.getById(id), [id]);
  const moneyWallet = useApi(() => customerService.getMoneyWallet(id), [id]);
  const pointWallet = useApi(() => customerService.getPointWallet(id), [id]);
  const transactions = useApi(() => customerService.getTransactions(id, { page: txPage, limit: LIMIT }), [id, txPage]);

  // Bank details fetched on demand & gated by permission
  const canViewBank = can('VIEW_WALLETS');
  const [bank, setBank] = useState<BankDetails | null>(null);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankError, setBankError] = useState<string | null>(null);

  const loadBankDetails = async () => {
    setBankLoading(true);
    setBankError(null);
    try {
      setBank(await customerService.getBankDetails(id));
    } catch (err) {
      setBankError(apiErrorMessage(err));
    } finally {
      setBankLoading(false);
    }
  };

  return (
    <AdminShell permission="VIEW_CUSTOMERS">
      <PageHeader title="Customer Profile" description={`Customer ID: ${id}`} />

      {profile.loading && <LoadingState />}
      {!profile.loading && profile.error && <ErrorState message={profile.error} onRetry={profile.refetch} />}
      {!profile.loading && !profile.error && profile.data && (
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <DetailRow label="Name" value={profile.data.name} />
                <DetailRow label="Mobile" value={profile.data.mobile} />
                <DetailRow label="Email" value={profile.data.email} />
                <DetailRow label="Status" value={<StatusBadge status={profile.data.status} />} />
                <DetailRow label="Joined" value={formatDate(profile.data.createdAt)} />
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Wallet className="h-4 w-4 text-emerald-600" /> Money Wallet
                </CardTitle>
              </CardHeader>
              <CardContent>
                {moneyWallet.loading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                ) : moneyWallet.error ? (
                  <p className="text-sm text-red-600">{moneyWallet.error}</p>
                ) : (
                  <>
                    <p className="text-3xl font-bold text-slate-900" data-testid="money-wallet-balance">
                      {formatMoney(moneyWallet.data?.balance)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">Updated {formatDate(moneyWallet.data?.updatedAt)}</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Coins className="h-4 w-4 text-amber-600" /> Point Wallet ($dollar)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pointWallet.loading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                ) : pointWallet.error ? (
                  <p className="text-sm text-red-600">{pointWallet.error}</p>
                ) : (
                  <>
                    <p className="text-3xl font-bold text-slate-900" data-testid="point-wallet-balance">
                      {formatDollar(pointWallet.data?.balance)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">Updated {formatDate(pointWallet.data?.updatedAt)}</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="transactions">
            <TabsList className="bg-white">
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="bank">Bank Details</TabsTrigger>
            </TabsList>

            <TabsContent value="transactions" className="mt-4">
              {transactions.loading && <LoadingState />}
              {!transactions.loading && transactions.error && (
                <ErrorState message={transactions.error} onRetry={transactions.refetch} />
              )}
              {!transactions.loading && !transactions.error && transactions.data && (
                <>
                  {transactions.data.items?.length ? (
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Wallet</TableHead>
                            <TableHead>Direction</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactions.data.items.map((t) => (
                            <TableRow key={t.id}>
                              <TableCell className="font-medium">{t.type}</TableCell>
                              <TableCell>{t.wallet || '\u2014'}</TableCell>
                              <TableCell>
                                <span className={t.direction === 'CREDIT' ? 'text-emerald-600' : 'text-red-600'}>
                                  {t.direction || '\u2014'}
                                </span>
                              </TableCell>
                              <TableCell>{t.wallet === 'POINT' ? formatDollar(t.amount) : formatMoney(t.amount)}</TableCell>
                              <TableCell><StatusBadge status={t.status} /></TableCell>
                              <TableCell className="text-slate-500">{formatDate(t.createdAt)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <EmptyState message="No transactions found." />
                  )}
                  <Pager page={txPage} limit={LIMIT} total={transactions.data.total || 0} onPageChange={setTxPage} />
                </>
              )}
            </TabsContent>

            <TabsContent value="bank" className="mt-4">
              {!canViewBank ? (
                <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
                  <ShieldAlert className="h-5 w-5 text-red-400" />
                  You do not have the VIEW_WALLETS permission required to view bank details.
                </div>
              ) : bank ? (
                <Card className="max-w-md border-slate-200 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Landmark className="h-4 w-4 text-slate-600" /> Bank Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DetailRow label="Account Holder" value={bank.accountHolder} />
                    <DetailRow label="Account Number" value={bank.accountNumber} />
                    <DetailRow label="IFSC" value={bank.ifsc} />
                    <DetailRow label="Bank" value={bank.bankName} />
                    <DetailRow label="UPI ID" value={bank.upiId} />
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3 rounded-xl border border-dashed border-slate-300 bg-white p-6">
                  <p className="text-sm text-slate-500">
                    Bank details contain sensitive information and are only loaded on request. Access is logged.
                  </p>
                  {bankError && <p className="text-sm text-red-600">{bankError}</p>}
                  <Button onClick={loadBankDetails} disabled={bankLoading} variant="outline" data-testid="load-bank-details">
                    {bankLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Reveal bank details
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </AdminShell>
  );
}
