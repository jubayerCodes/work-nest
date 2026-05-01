"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWorkspaceStore } from "@/store/workspace.store";
import { api } from "@/lib/api";
import type { IGoal } from "@worknest/types";
import { formatDate, isOverdue, GOAL_STATUS_COLORS } from "@worknest/utils";
import Link from "next/link";
import toast from "react-hot-toast";

type GoalStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "AT_RISK";
const STATUSES: GoalStatus[] = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "AT_RISK"];
const STATUS_LABELS: Record<GoalStatus, string> = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  AT_RISK: "At Risk",
};

export default function GoalsPage() {
  const params = useParams();
  const router = useRouter();
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);
  const [goals, setGoals] = useState<IGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<GoalStatus | "">("");
  const [showCreate, setShowCreate] = useState(false);
  const workspaceId = activeWorkspace?.id;

  const fetchGoals = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      const res = await api.get(`/workspaces/${workspaceId}/goals?${params}`);
      setGoals(res.data.goals ?? []);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, search, statusFilter]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  return (
    <div style={{ maxWidth: 900 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ color: "var(--text)", margin: 0 }}>Goals</h2>
          <p style={{ margin: 0, fontSize: "0.875rem" }}>Track your team's objectives and milestones</p>
        </div>
        <button className="btn btn-primary" id="create-goal-btn" onClick={() => setShowCreate(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New Goal
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <input
          className="form-input"
          placeholder="Search goals…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 260 }}
        />
        <select
          className="form-input"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as GoalStatus | "")}
          style={{ maxWidth: 180 }}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {/* Goals List */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 90, borderRadius: "var(--radius-lg)" }} />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎯</div>
          <h3 className="empty-state-title">No goals yet</h3>
          <p className="empty-state-desc">Create your first goal to start tracking team progress.</p>
          <button className="btn btn-primary mt-4" onClick={() => setShowCreate(true)}>
            Create first goal
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {goals.map((goal) => (
            <Link
              key={goal.id}
              href={`/workspace/${params.workspaceSlug}/goals/${goal.id}`}
              style={{ textDecoration: "none" }}
            >
              <div
                className="card"
                style={{
                  cursor: "pointer",
                  transition: "border-color var(--transition)",
                  borderColor: "var(--border)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border-strong)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: GOAL_STATUS_COLORS[goal.status],
                      marginTop: 5,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                      <h4 className="truncate" style={{ color: "var(--text)", margin: 0 }}>
                        {goal.title}
                      </h4>
                      <span
                        className="badge"
                        style={{
                          background: GOAL_STATUS_COLORS[goal.status] + "20",
                          color: GOAL_STATUS_COLORS[goal.status],
                          borderColor: GOAL_STATUS_COLORS[goal.status] + "40",
                        }}
                      >
                        {STATUS_LABELS[goal.status]}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: "1rem",
                        marginTop: "0.5rem",
                        fontSize: "0.8125rem",
                        color: "var(--text-muted)",
                        flexWrap: "wrap",
                      }}
                    >
                      <span>Owner: {goal.owner?.name}</span>
                      {goal.dueDate && (
                        <span
                          style={{
                            color: isOverdue(goal.dueDate) && goal.status !== "COMPLETED" ? "var(--danger)" : "inherit",
                          }}
                        >
                          Due {formatDate(goal.dueDate)}
                        </span>
                      )}
                      {goal._count && (
                        <span>
                          {goal._count.milestones} milestones · {goal._count.actionItems} items
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateGoalModal
          workspaceId={workspaceId!}
          onClose={() => setShowCreate(false)}
          onCreated={(g) => {
            setGoals((prev) => [g, ...prev]);
            setShowCreate(false);
          }}
        />
      )}
    </div>
  );
}

function CreateGoalModal({
  workspaceId,
  onClose,
  onCreated,
}: {
  workspaceId: string;
  onClose: () => void;
  onCreated: (g: IGoal) => void;
}) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      const res = await api.post(`/workspaces/${workspaceId}/goals`, { title, dueDate: dueDate || null });
      toast.success("Goal created!");
      onCreated(res.data.data);
    } catch {
      toast.error("Failed to create goal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">New Goal</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="form-group">
            <label className="form-label">Goal title *</label>
            <input
              id="goal-title"
              className="form-input"
              placeholder="e.g. Launch product v2.0"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Due date</label>
            <input
              id="goal-due-date"
              type="date"
              className="form-input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              id="create-goal-submit"
              className="btn btn-primary"
              disabled={loading || !title.trim()}
            >
              {loading ? "Creating…" : "Create goal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
