'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@worknest/validators';
import { useAuthStore } from '@/store/auth.store';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Suspense } from 'react';

function LoginForm() {
  const { login, isLoading } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      await login(data.email, data.password);
      // Redirect to the page they were trying to access, or dashboard
      const from = searchParams.get('from') ?? '/dashboard';
      router.push(from);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Invalid email or password';
      toast.error(msg);
    }
  };

  return (
    <div className="auth-card animate-fade">
      <div className="auth-logo">
        <div className="sidebar-logo-mark">W</div>
        <span className="sidebar-logo-text">WorkNest</span>
      </div>

      <h1 style={{ fontSize: '1.5rem', marginBottom: '0.375rem' }}>Welcome back</h1>
      <p className="text-muted text-sm" style={{ marginBottom: '1.75rem' }}>
        Sign in to your workspace
      </p>

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label" htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className={`form-input ${errors.email ? 'error' : ''}`}
            placeholder="you@company.com"
            {...register('email')}
          />
          {errors.email && <span className="form-error">{errors.email.message}</span>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className={`form-input ${errors.password ? 'error' : ''}`}
            placeholder="••••••••"
            {...register('password')}
          />
          {errors.password && <span className="form-error">{errors.password.message}</span>}
        </div>

        <button
          type="submit"
          id="login-submit"
          className="btn btn-primary btn-lg w-full"
          style={{ marginTop: '0.5rem' }}
          disabled={isLoading}
        >
          {isLoading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              Signing in…
            </span>
          ) : 'Sign in'}
        </button>
      </form>

      <p className="text-center text-sm text-muted" style={{ marginTop: '1.5rem' }}>
        Don&apos;t have an account?{' '}
        <Link href="/register" style={{ color: 'var(--primary)', fontWeight: 500 }}>
          Create one
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="auth-card" />}>
      <LoginForm />
    </Suspense>
  );
}
