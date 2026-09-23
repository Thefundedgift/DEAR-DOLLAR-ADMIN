'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AdminShell } from '@/components/admin/app-shell';
import { PageHeader, LoadingState, ErrorState, EmptyState, StatusBadge, Pager } from '@/components/admin/shared';
import { useApi } from '@/hooks/use-api';
import { customerService } from '@/services/customer.service';
import { formatDate } from '@/lib/format';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Eye } from 'lucide-react';

const LIMIT = 20;

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const { data, loading, error, refetch } = useApi(
    () => customerService.list({ search: query || undefined, page, limit: LIMIT }),
    [query, page]
  );

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setQuery(search.trim());
  };

  return (
    <AdminShell permission="VIEW_CUSTOMERS">
      <PageHeader title="Customers" description="Search and manage customer accounts." />

      <form onSubmit={onSearch} className="mb-4 flex max-w-md gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            data-testid="customer-search"
            placeholder="Search by name, mobile or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-white pl-9"
          />
        </div>
        <Button type="submit" variant="outline" className="bg-white">
          Search
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
                    <TableHead>Name</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name || '\u2014'}</TableCell>
                      <TableCell>{c.mobile || '\u2014'}</TableCell>
                      <TableCell>{c.email || '\u2014'}</TableCell>
                      <TableCell><StatusBadge status={c.status} /></TableCell>
                      <TableCell className="text-slate-500">{formatDate(c.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/customers/${c.id}`} data-testid={`view-customer-${c.id}`}>
                            <Eye className="mr-1.5 h-3.5 w-3.5" /> View
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState message="No customers found." />
          )}
          <Pager page={page} limit={LIMIT} total={data.total || 0} onPageChange={setPage} />
        </>
      )}
    </AdminShell>
  );
}
