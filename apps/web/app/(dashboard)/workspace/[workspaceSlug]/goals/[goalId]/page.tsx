'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useWorkspaceStore } from '@/store/workspace.store';
import { api } from '@/lib/api';
import type { IGoal, IMilestone, IActivity } from '@worknest/types';
import { formatDate, timeAgo, GOAL_STATUS_COLORS } from '@worknest/utils';
import toast from 'react-hot-toast';
import { useSocket } from '@/hooks/useSocket';

const STATUS_OPTIONS = [
  { value: 'NOT_STARTED', label: 'Not Started' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'AT_RISK', label: 'At Risk' },
];

export default function GoalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);
  const [goal, setGoal] = useState<IGoal & { milestones: IMilestone[]; activities: (IActivity & { actor: { id: string; name: string; avatarUrl: string | null } })[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMilestone, setNewMilestone] = useState('');
  const [addingMs, setAddingMs] = useState(false);

  const workspaceId = activeWorkspace?.id;
  const goalId = params.goalId as string;
  const socket = useSocket(workspaceId);

  const fetchGoal = async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const res = await api.get(`/workspaces/${workspaceId}/goals/${goalId}`);
      setGoal(res.data.data);
    } catch { toast.error('Goal not found'); router.back(); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchGoal(); }, [workspaceId, goalId]); // eslint-disable-line

  // Live updates
  useEffect(() => {
    const handleGoalUpdate = (updated: IGoal) => {
      if (updated.id === goalId) setGoal((prev) => prev ? { ...prev, ...updated } : prev);
    };
    socket.on('goal:updated', handleGoalUpdate as never);
    return () => { socket.off('goal:updated', handleGoalUpdate as never); };
  }, [socket, goalId]);

  const updateStatus = async (status: string) => {
    if (!workspaceId || !goal) return;
    try {
      await api.patch(`/workspaces/${workspaceId}/goals/${goalId}`, { status });
      setGoal((prev) => prev ? { ...prev, status: status as IGoal['status'] } : prev);
      toast.success('Status updated');
    } catch { toast.error('Failed to update status'); }
  };

  const addMilestone = async () => {
    if (!newMilestone.trim() || !workspaceId) return;
    setAddingMs(true);
    try {
      const res = await api.post(`/workspaces/${workspaceId}/goals/${goalId}/milestones`, { title: newMilestone });
      setGoal((prev) => prev ? { ...prev, milestones: [...prev.milestones, res.data.data] } : prev);
      setNewMilestone('');
    } catch { toast.error('Failed to add milestone'); }
    finally { setAddingMs(false); }
  };

  const toggleMilestone = async (ms: IMilestone) => {
    if (!workspaceId) return;
    try {
      await api.patch(`/workspaces/${workspaceId}/goals/${goalId}/milestones/${ms.id}`, { completed: !ms.completed });
      setGoal((prev) => prev ? { ...prev, milestones: prev.milestones.map((m) => m.id === ms.id ? { ...m, completed: !m.completed } : m) } : prev);
    } catch { toast.error('Failed to update milestone'); }
  };

  if (loading) return (
    <div style={{ maxWidth: 780 }}>
      {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 'var(--radius-lg)', marginBottom: '1rem' }} />)}
    </div>
  );
  if (!goal) return null;

  const completedMs = goal.milestones.filter((m) => m.completed).length;
  const totalMs = goal.milestones.length;
  const progressPct = totalMs > 0 ? Math.round((completedMs / totalMs) * 100) : 0;

  return (
    <div style={{ maxWidth: 780 }}>
      {/* Back */}
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: '1rem' }} onClick={() => router.back()}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        Back to Goals
      </button>

      {/* Goal Header */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ color: 'var(--text)', margin: '0 0 0.5rem' }}>{goal.title}</h2>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8125rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
              <span>Owner: <strong style={{ color: 'var(--text)' }}>{goal.owner?.name}</strong></span>
              {goal.dueDate && <span>Due: <strong style={{ color: 'var(--text)' }}>{formatDate(goal.dueDate)}</strong></span>}
            </div>
          </div>
          <select
            className="form-input"
            style={{ maxWidth: 170, padding: '0.375rem 0.75rem', color: GOAL_STATUS_COLORS[goal.status] }}
            value={goal.status}
            onChange={(e) => updateStatus(e.target.value)}
          >
            {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        {/* Description */}
        {goal.description && (
          <div style={{ marginTop: '1rem', padding: '0.875rem', background: 'var(--surface-2)', borderRadius: 'var(--radius)', fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.7 }}
            dangerouslySetInnerHTML={{ __html: goal.description }}
          />
        )}
      </div>

      {/* Milestones */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3>Milestones</h3>
          {totalMs > 0 && (
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{completedMs}/{totalMs} · {progressPct}%</span>
          )}
        </div>

        {totalMs > 0 && (
          <div style={{ height: 6, background: 'var(--surface-3)', borderRadius: 99, marginBottom: '1rem', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progressPct}%`, background: 'var(--success)', borderRadius: 99, transition: 'width 0.3s ease' }} />
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {goal.milestones.map((ms) => (
            <div key={ms.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
              onClick={() => toggleMilestone(ms)}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${ms.completed ? 'var(--success)' : 'var(--border-strong)'}`, background: ms.completed ? 'var(--success)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                {ms.completed && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>}
              </div>
              <span style={{ fontSize: '0.875rem', color: ms.completed ? 'var(--text-subtle)' : 'var(--text)', textDecoration: ms.completed ? 'line-through' : 'none' }}>
                {ms.title}
              </span>
              {ms.dueDate && <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-subtle)' }}>{formatDate(ms.dueDate)}</span>}
            </div>
          ))}

          {/* Add milestone */}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <input className="form-input" placeholder="Add a milestone…" value={newMilestone}
              onChange={(e) => setNewMilestone(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addMilestone()}
              style={{ flex: 1 }}
            />
            <button className="btn btn-secondary btn-sm" onClick={addMilestone} disabled={addingMs || !newMilestone.trim()}>
              {addingMs ? '…' : 'Add'}
            </button>
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>Activity</h3>
        {goal.activities.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No activity yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {goal.activities.map((act) => (
              <div key={act.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <div className="avatar avatar-sm" style={{ flexShrink: 0 }}>
                  {act.actor?.avatarUrl ? <img src={act.actor.avatarUrl} alt="" /> : act.actor?.name[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.8375rem', color: 'var(--text)' }}>
                    <strong>{act.actor?.name}</strong>{' '}
                    {act.type === 'GOAL_STATUS_CHANGED' && `changed status to "${(act.payload as Record<string, string>).to?.replace('_', ' ')}"`}
                    {act.type === 'MILESTONE_COMPLETED' && `completed "${(act.payload as Record<string, string>).title}"`}
                    {act.type === 'MILESTONE_ADDED' && `added milestone "${(act.payload as Record<string, string>).title}"`}
                    {act.type === 'GOAL_CREATED' && 'created this goal'}
                    {!['GOAL_STATUS_CHANGED', 'MILESTONE_COMPLETED', 'MILESTONE_ADDED', 'GOAL_CREATED'].includes(act.type) && act.type.toLowerCase().replace(/_/g, ' ')}
                  </span>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '0.15rem' }}>{timeAgo(act.createdAt)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
