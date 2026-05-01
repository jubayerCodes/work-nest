'use client';
import { useEffect, useState } from 'react';
import { useWorkspaceStore } from '@/store/workspace.store';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import type { IWorkspaceMember } from '@worknest/types';
import { getInitials } from '@worknest/utils';
import toast from 'react-hot-toast';

const PRESET_COLORS = ['#6366f1','#8b5cf6','#ec4899','#ef4444','#f59e0b','#22c55e','#14b8a6','#3b82f6'];

export default function SettingsPage() {
  const { activeWorkspace, fetchWorkspace } = useWorkspaceStore();
  const user = useAuthStore((s) => s.user);
  const [members, setMembers] = useState<IWorkspaceMember[]>([]);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [saving, setSaving] = useState(false);
  const [inviting, setInviting] = useState(false);

  const workspaceId = activeWorkspace?.id;
  const isAdmin = user?.memberships?.some((m) => m.workspace.id === workspaceId && m.role === 'ADMIN');

  useEffect(() => {
    if (!activeWorkspace) return;
    setName(activeWorkspace.name);
    setDesc(activeWorkspace.description ?? '');
    setColor(activeWorkspace.accentColor);
    if (workspaceId) {
      api.get(`/workspaces/${workspaceId}`).then((r) => setMembers(r.data.data.members ?? []));
    }
  }, [activeWorkspace, workspaceId]);

  const saveSettings = async () => {
    if (!workspaceId) return;
    setSaving(true);
    try {
      await api.patch(`/workspaces/${workspaceId}`, { name, description: desc, accentColor: color });
      toast.success('Settings saved!');
      if (workspaceId) fetchWorkspace(workspaceId);
    } catch { toast.error('Failed to save settings'); }
    finally { setSaving(false); }
  };

  const sendInvite = async () => {
    if (!inviteEmail.trim() || !workspaceId) return;
    setInviting(true);
    setInviteLink('');
    try {
      const res = await api.post(`/workspaces/${workspaceId}/members/invite`, { email: inviteEmail });
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteLink(res.data.data?.inviteLink ?? '');
      setInviteEmail('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to send invite';
      toast.error(msg);
    } finally { setInviting(false); }
  };

  const removeMember = async (memberId: string, memberUserId: string) => {
    if (!workspaceId || !confirm('Remove this member?')) return;
    try {
      await api.delete(`/workspaces/${workspaceId}/members/${memberUserId}`);
      setMembers((p) => p.filter((m) => m.id !== memberId));
      toast.success('Member removed');
    } catch { toast.error('Failed to remove member'); }
  };

  const changeRole = async (memberUserId: string, role: 'ADMIN' | 'MEMBER') => {
    if (!workspaceId) return;
    try {
      await api.patch(`/workspaces/${workspaceId}/members/${memberUserId}/role`, { role });
      setMembers((p) => p.map((m) => m.user.id === memberUserId ? { ...m, role } : m));
      toast.success('Role updated');
    } catch { toast.error('Failed to update role'); }
  };

  return (
    <div style={{ maxWidth: 680 }}>
      <h2 style={{ color: 'var(--text)', marginBottom: '1.5rem' }}>Workspace Settings</h2>

      {/* General Settings */}
      {isAdmin && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1.25rem', fontSize: '1rem' }}>General</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Workspace name</label>
              <input id="ws-name-setting" className="form-input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-input" rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} style={{ resize: 'vertical' }} />
            </div>
            <div className="form-group">
              <label className="form-label">Accent color</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {PRESET_COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => setColor(c)}
                    style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: color === c ? '3px solid white' : '3px solid transparent', cursor: 'pointer', boxShadow: color === c ? `0 0 0 2px ${c}` : 'none', transition: 'all 0.15s' }} />
                ))}
              </div>
            </div>
            <button className="btn btn-primary" style={{ alignSelf: 'flex-end' }} onClick={saveSettings} disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      )}

      {/* Members */}
      <div className="card">
        <h3 style={{ marginBottom: '1.25rem', fontSize: '1rem' }}>Members</h3>

        {isAdmin && (
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '0.625rem', marginBottom: '0.625rem' }}>
              <input id="invite-email" type="email" className="form-input" placeholder="Invite by email…" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendInvite()} style={{ flex: 1 }} />
              <button className="btn btn-primary btn-sm" onClick={sendInvite} disabled={inviting || !inviteEmail.trim()}>
                {inviting ? 'Sending…' : 'Send invite'}
              </button>
            </div>
            {inviteLink && (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.625rem 0.875rem', background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', flexShrink: 0 }}>🔗 Share link:</span>
                <input readOnly value={inviteLink} className="form-input" style={{ flex: 1, fontSize: '0.75rem', padding: '0.25rem 0.5rem' }} onClick={(e) => (e.target as HTMLInputElement).select()} />
                <button className="btn btn-ghost btn-sm" onClick={() => { navigator.clipboard.writeText(inviteLink); toast.success('Link copied!'); }}>
                  Copy
                </button>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {members.map((member) => (
            <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
              <div className="avatar avatar-md">
                {member.user.avatarUrl ? <img src={member.user.avatarUrl} alt="" /> : getInitials(member.user.name)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}>{member.user.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{member.user.email}</div>
              </div>
              {isAdmin && member.user.id !== user?.id ? (
                <>
                  <select className="form-input" style={{ width: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.8125rem' }}
                    value={member.role} onChange={(e) => changeRole(member.user.id, e.target.value as 'ADMIN' | 'MEMBER')}>
                    <option value="MEMBER">Member</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                  <button className="btn btn-danger btn-sm" onClick={() => removeMember(member.id, member.user.id)}>Remove</button>
                </>
              ) : (
                <span className={`badge ${member.role === 'ADMIN' ? 'badge-primary' : 'badge-muted'}`}>{member.role}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
