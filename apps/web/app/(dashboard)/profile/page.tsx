'use client';
import { useState, useRef } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import { getInitials } from '@worknest/utils';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [name, setName] = useState(user?.name ?? '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await api.patch('/users/profile', { name });
      // users.router returns { success, data: user } — flat, not { data: { user } }
      setUser(res.data.data);
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('avatar', file);
      const res = await api.post('/users/avatar', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // users.router returns { success, data: user } — flat, not { data: { user } }
      setUser(res.data.data);
      toast.success('Avatar updated!');
    } catch {
      toast.error('Failed to upload avatar');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ margin: 0, color: 'var(--text)' }}>My Profile</h2>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem' }}>Manage your account settings and avatar</p>
      </div>

      {/* Avatar section */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1.25rem', fontSize: '1rem', color: 'var(--text)' }}>Profile Picture</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ position: 'relative' }}>
            <div className="avatar avatar-xl" style={{ width: 80, height: 80, fontSize: '1.75rem' }}>
              {user?.avatarUrl
                ? <img src={user.avatarUrl} alt={user.name} />
                : getInitials(user?.name ?? 'U')
              }
            </div>
            {uploading && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 20, height: 20, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%' }} className="animate-spin" />
              </div>
            )}
          </div>
          <div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? 'Uploading…' : 'Upload new photo'}
            </button>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
              JPEG, PNG, WebP or GIF · Max 5MB · Auto-cropped to 200×200
            </p>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
          </div>
        </div>
      </div>

      {/* Profile form */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1.25rem', fontSize: '1rem', color: 'var(--text)' }}>Account Details</h3>
        <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="profile-name">Display Name</label>
            <input
              id="profile-name"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              className="form-input"
              value={user?.email ?? ''}
              readOnly
              style={{ opacity: 0.6, cursor: 'not-allowed' }}
            />
            <span className="form-hint">Email cannot be changed after registration</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
            <button type="submit" id="save-profile" className="btn btn-primary" disabled={saving || !name.trim()}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Workspace memberships */}
      <div className="card">
        <h3 style={{ margin: '0 0 1.25rem', fontSize: '1rem', color: 'var(--text)' }}>Workspace Memberships</h3>
        {user?.memberships?.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No workspaces yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {user?.memberships?.map((m) => (
              <div key={m.workspace.id} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.625rem 0.875rem', background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: m.workspace.accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.875rem', flexShrink: 0 }}>
                  {m.workspace.name[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--text)' }}>{m.workspace.name}</div>
                </div>
                <span className={`badge ${m.role === 'ADMIN' ? 'badge-primary' : 'badge-muted'}`}>
                  {m.role}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
