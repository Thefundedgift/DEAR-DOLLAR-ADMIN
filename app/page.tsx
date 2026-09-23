'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { admin, initialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!initialized) return;
    router.replace(admin ? '/dashboard' : '/login');
  }, [initialized, admin, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
    </div>
  );
}
