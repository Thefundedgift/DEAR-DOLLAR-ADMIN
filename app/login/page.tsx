'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { apiErrorMessage } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CircleDollarSign, Eye, EyeOff, Loader2, Lock, ShieldCheck, Wallet, LineChart, AlertTriangle } from 'lucide-react';

function LoginForm() {
  const { admin, initialized, login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const expired = searchParams.get('expired') === '1';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialized && admin) router.replace('/dashboard');
  }, [initialized, admin, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter your email/username and password.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await login(email.trim(), password);
      router.replace('/dashboard');
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Branding panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-slate-950 p-12 lg:flex">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500 shadow-lg shadow-emerald-500/30">
            <CircleDollarSign className="h-6 w-6 text-slate-950" />
          </div>
          <div>
            <p className="text-lg font-bold tracking-wide text-white">DEAR DOLLAR</p>
            <p className="text-xs uppercase tracking-widest text-emerald-400">Admin Panel</p>
          </div>
        </div>
        <div className="relative space-y-8">
          <h1 className="text-4xl font-bold leading-tight text-white">
            Point Market
            <br />
            <span className="text-emerald-400">Administration</span>
          </h1>
          <ul className="space-y-4 text-sm text-slate-300">
            <li className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-400" />
              Role-based access with granular permissions
            </li>
            <li className="flex items-center gap-3">
              <Wallet className="h-5 w-5 shrink-0 text-emerald-400" />
              Payment verification, buy &amp; sell approvals
            </li>
            <li className="flex items-center gap-3">
              <LineChart className="h-5 w-5 shrink-0 text-emerald-400" />
              Reports, audit logs &amp; full traceability
            </li>
          </ul>
        </div>
        <p className="relative text-xs uppercase tracking-widest text-slate-500">
          Powered by <span className="font-semibold text-slate-300">INTERNET ZONE</span>
        </p>
      </div>

      {/* Login form */}
      <div className="flex items-center justify-center bg-slate-50 px-6 py-12">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2 text-center lg:text-left">
            <div className="mb-4 flex items-center justify-center gap-2 lg:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500">
                <CircleDollarSign className="h-5 w-5 text-slate-950" />
              </div>
              <span className="text-lg font-bold text-slate-900">DEAR DOLLAR</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Admin sign in</h2>
            <p className="text-sm text-slate-500">
              Restricted area. Authorized administrators only.
            </p>
          </div>

          {expired && !error && (
            <Alert className="border-amber-300 bg-amber-50 text-amber-900">
              <AlertTriangle className="h-4 w-4 !text-amber-600" />
              <AlertTitle>Session expired</AlertTitle>
              <AlertDescription>Please sign in again to continue.</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" data-testid="login-error">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Sign in failed</AlertTitle>
              <AlertDescription className="break-words">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email / Username</Label>
              <Input
                id="email"
                data-testid="login-email"
                type="text"
                autoComplete="username"
                placeholder="admin@deardollar.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  data-testid="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 bg-white pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              data-testid="login-submit"
              disabled={submitting}
              className="h-11 w-full bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" /> Sign in
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-slate-400">
            Protected by JWT authentication with refresh-token rotation.
            <br />
            Login attempts are rate limited and audited.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-950">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
