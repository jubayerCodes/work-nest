'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterInput } from '@worknest/validators';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { register: registerUser, isLoading } = useAuthStore();
  const router = useRouter();

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    try {
      await registerUser(data.name, data.email, data.password);
      toast.success('Account created! Welcome to WorkNest 🎉');
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Registration failed';
      toast.error(msg);
    }
  };

  return (
    <div className="auth-card animate-fade">
      <div className="auth-logo">
        <div className="sidebar-logo-mark">W</div>
        <span className="sidebar-logo-text">WorkNest</span>
      </div>

      <h1 style={{ fontSize: '1.5rem', marginBottom: '0.375rem' }}>Create your account</h1>
      <p className="text-muted text-sm" style={{ marginBottom: '1.75rem' }}>
        Start collaborating with your team today
      </p>

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label" htmlFor="name">Full name</label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            className={`form-input ${errors.name ? 'error' : ''}`}
            placeholder="Alex Johnson"
            {...register('name')}
          />
          {errors.name && <span className="form-error">{errors.name.message}</span>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="reg-email">Email address</label>
          <input
            id="reg-email"
            type="email"
            autoComplete="email"
            className={`form-input ${errors.email ? 'error' : ''}`}
            placeholder="you@company.com"
            {...register('email')}
          />
          {errors.email && <span className="form-error">{errors.email.message}</span>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="reg-password">Password</label>
          <input
            id="reg-password"
            type="password"
            autoComplete="new-password"
            className={`form-input ${errors.password ? 'error' : ''}`}
            placeholder="Min. 8 chars, 1 uppercase, 1 number"
            {...register('password')}
          />
          {errors.password && <span className="form-error">{errors.password.message}</span>}
        </div>

        <button
          type="submit"
          id="register-submit"
          className="btn btn-primary btn-lg w-full"
          style={{ marginTop: '0.5rem' }}
          disabled={isLoading}
        >
          {isLoading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              Creating account…
            </span>
          ) : 'Get started free'}
        </button>
      </form>

      <p className="text-center text-sm text-muted" style={{ marginTop: '1.5rem' }}>
        Already have an account?{' '}
        <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 500 }}>
          Sign in
        </Link>
      </p>
    </div>
  );
}
