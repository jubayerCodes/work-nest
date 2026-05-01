'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useWorkspaceStore } from '@/store/workspace.store';
import { api } from '@/lib/api';

interface InvitePreview {
  email: string;
  workspace: { name: string; accentColor: string };
}

function InviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const { user, isAuthenticated } = useAuthStore();
  const { fetchWorkspaces, setActiveWorkspace } = useWorkspaceStore();

  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'accepting' | 'error' | 'done'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  // Load invitation preview
  useEffect(() => {
    if (!token) { setStatus('error'); setErrorMsg('Invalid invitation link.'); return; }
    api.get(`/workspaces/invitations/${token}`)
      .then((r) => { setPreview(r.data.data); setStatus('ready'); })
      .catch((e) => {
        setStatus('error');
        setErrorMsg(e?.response?.data?.message ?? 'This invitation is invalid or has expired.');
      });
  }, [token]);

  const acceptInvite = async () => {
    if (!token) return;
    setStatus('accepting');
    try {
      const res = await api.post('/workspaces/invitations/accept', { token });
      const workspace = res.data.data; // { id, name, slug, accentColor }
      // Refresh workspace list so sidebar shows the new workspace
      await fetchWorkspaces();
      // Use the slug from API response directly — avoids stale closure on workspaces
      if (workspace?.id) {
        const joined = useWorkspaceStore.getState().workspaces.find((w) => w.id === workspace.id);
        if (joined) setActiveWorkspace(joined);
      }
      router.push(workspace?.slug ? `/workspace/${workspace.slug}` : '/dashboard');
    } catch (e: unknown) {
      setStatus('error');
      setErrorMsg((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to accept invitation.');
    }
  };

  // If user is not logged in, redirect to login and come back
  if (!isAuthenticated) {
    return (
      <div className="auth-layout">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✉️</div>
          {preview ? (
            <>
              <h2 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>You&apos;re invited!</h2>
              <p style={{ marginBottom: '1.5rem' }}>
                You&apos;ve been invited to join <strong style={{ color: 'var(--text)' }}>{preview.workspace.name}</strong>.
                Log in or create an account to accept.
              </p>
            </>
          ) : (
            <p style={{ marginBottom: '1.5rem' }}>Log in to accept your invitation.</p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <a href={`/login?from=/invite?token=${token}`} className="btn btn-primary btn-lg w-full">
              Log in to accept
            </a>
            <a href={`/register?from=/invite?token=${token}`} className="btn btn-secondary btn-lg w-full">
              Create account
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-layout">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        {status === 'loading' && (
          <>
            <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 1rem' }} className="animate-spin" />
            <p>Loading invitation…</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>❌</div>
            <h2 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>Invalid invitation</h2>
            <p style={{ marginBottom: '1.5rem' }}>{errorMsg}</p>
            <button className="btn btn-secondary" onClick={() => router.push('/dashboard')}>Go to dashboard</button>
          </>
        )}

        {(status === 'ready' || status === 'accepting') && preview && (
          <>
            <div
              style={{ width: 56, height: 56, borderRadius: 14, background: preview.workspace.accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: '0 auto 1.25rem' }}
            >
              {preview.workspace.name[0]}
            </div>
            <h2 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>You&apos;re invited!</h2>
            <p style={{ marginBottom: '0.25rem' }}>
              Logged in as <strong style={{ color: 'var(--text)' }}>{user?.email}</strong>
            </p>
            <p style={{ marginBottom: '1.75rem' }}>
              Join <strong style={{ color: 'var(--text)' }}>{preview.workspace.name}</strong> on WorkNest
            </p>

            {preview.email !== user?.email && (
              <div style={{ background: 'var(--warning-muted)', border: '1px solid var(--warning)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', marginBottom: '1.25rem', fontSize: '0.8125rem', color: 'var(--warning)' }}>
                ⚠️ This invitation was sent to <strong>{preview.email}</strong>, but you&apos;re logged in as <strong>{user?.email}</strong>.
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                className="btn btn-primary btn-lg w-full"
                onClick={acceptInvite}
                disabled={status === 'accepting'}
              >
                {status === 'accepting' ? 'Accepting…' : 'Accept invitation'}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => router.push('/dashboard')}>
                Skip for now
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={
      <div className="auth-layout">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 1rem' }} className="animate-spin" />
          <p>Loading…</p>
        </div>
      </div>
    }>
      <InviteContent />
    </Suspense>
  );
}
