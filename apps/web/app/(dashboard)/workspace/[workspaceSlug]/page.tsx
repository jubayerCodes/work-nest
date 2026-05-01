'use client';
import { useEffect, useState } from 'react';
import { useWorkspaceStore } from '@/store/workspace.store';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { IAnalytics } from '@worknest/types';
import { GOAL_STATUS_COLORS } from '@worknest/utils';
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

function MetricCard({ label, value, sub, color }: { label: string; value: number | string; sub?: string; color?: string }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: '2rem', fontWeight: 700, color: color ?? 'var(--text)', lineHeight: 1 }}>{value}</span>
      {sub && <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>{sub}</span>}
    </div>
  );
}

export default function WorkspaceOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const { workspaces, setActiveWorkspace } = useWorkspaceStore();
  const [analytics, setAnalytics] = useState<IAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const slug = params.workspaceSlug as string;
  const workspace = workspaces.find((w) => w.slug === slug);

  useEffect(() => {
    if (workspace) setActiveWorkspace(workspace);
  }, [workspace, setActiveWorkspace]);

  useEffect(() => {
    if (!workspace) return;
    api.get(`/workspaces/${workspace.id}/analytics`)
      .then((r) => setAnalytics(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [workspace]);

  if (!workspace) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🏢</div>
        <h2 className="empty-state-title">Workspace not found</h2>
        <p className="empty-state-desc">This workspace doesn&apos;t exist or you don&apos;t have access.</p>
        <button className="btn btn-primary mt-4" onClick={() => router.push('/dashboard')}>Go to dashboard</button>
      </div>
    );
  }

  const goalPieData = analytics
    ? Object.entries(analytics.goalsByStatus).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 1100 }}>
      {/* Workspace Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: workspace.accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
          {workspace.name[0]}
        </div>
        <div>
          <h2 style={{ color: 'var(--text)', margin: 0 }}>{workspace.name}</h2>
          {workspace.description && <p style={{ margin: 0, fontSize: '0.875rem' }}>{workspace.description}</p>}
        </div>
      </div>

      {/* Metric Cards */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 110, borderRadius: 'var(--radius-lg)' }} />)}
        </div>
      ) : analytics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          <MetricCard label="Total Goals" value={Object.values(analytics.goalsByStatus).reduce((a, b) => a + b, 0)} />
          <MetricCard label="Completed Goals" value={analytics.goalsByStatus.COMPLETED ?? 0} color="var(--success)" />
          <MetricCard label="Overdue Items" value={analytics.overdueActionItems} color={analytics.overdueActionItems > 0 ? 'var(--danger)' : 'var(--text)'} />
          <MetricCard label="Completion Rate" value={`${analytics.completionRate}%`} color="var(--primary)" sub="goal completion" />
        </div>
      )}

      {/* Charts */}
      {!loading && analytics && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* Pie Chart */}
          <div className="card">
            <h3 style={{ marginBottom: '1.25rem', fontSize: '0.9375rem' }}>Goals by Status</h3>
            {goalPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={goalPieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name.replace('_', ' ')} ${Math.round((percent ?? 0) * 100)}%`} labelLine={false}>
                    {goalPieData.map((entry) => (
                      <Cell key={entry.name} fill={GOAL_STATUS_COLORS[entry.name] ?? '#6366f1'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <p className="empty-state-title" style={{ fontSize: '0.875rem' }}>No goals yet</p>
              </div>
            )}
          </div>

          {/* Trend Chart */}
          <div className="card">
            <h3 style={{ marginBottom: '1.25rem', fontSize: '0.9375rem' }}>Task Completions (30d)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={analytics.trend}>
                <defs>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: 'var(--text-subtle)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-subtle)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }} />
                <Area type="monotone" dataKey="completed" stroke="#6366f1" strokeWidth={2} fill="url(#colorCompleted)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
