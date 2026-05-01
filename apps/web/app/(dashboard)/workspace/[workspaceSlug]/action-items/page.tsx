'use client';
import { useEffect, useState, useCallback } from 'react';
import { useWorkspaceStore } from '@/store/workspace.store';
import { api } from '@/lib/api';
import type { IActionItem } from '@worknest/types';
import { isOverdue, formatDate, PRIORITY_COLORS, ACTION_STATUS_LABELS } from '@worknest/utils';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import toast from 'react-hot-toast';
import { useSocket } from '@/hooks/useSocket';

type ActionStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
const COLUMNS: ActionStatus[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];

const COLUMN_COLORS: Record<ActionStatus, string> = {
  TODO: '#6b7280', IN_PROGRESS: '#3b82f6', IN_REVIEW: '#f59e0b', DONE: '#22c55e',
};

// --- Kanban Card ---
function KanbanCard({ item, overlay }: { item: IActionItem; overlay?: boolean }) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({ id: item.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    cursor: overlay ? 'grabbing' : 'grab',
    marginBottom: '0.5rem',
    background: 'var(--surface-2)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding: '0.625rem 0.75rem',
    userSelect: 'none',
    touchAction: 'none',
    boxShadow: overlay ? '0 8px 24px rgba(0,0,0,0.3)' : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div style={{ marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text)', lineHeight: 1.4 }}>
        {item.title}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: PRIORITY_COLORS[item.priority], background: PRIORITY_COLORS[item.priority] + '20', padding: '1px 6px', borderRadius: 99 }}>
          {item.priority}
        </span>
        {item.assignee && (
          <div
            style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: '#fff' }}
            title={item.assignee.name}
          >
            {item.assignee.name[0]}
          </div>
        )}
        {item.dueDate && (
          <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: isOverdue(item.dueDate) && item.status !== 'DONE' ? 'var(--danger)' : 'var(--text-subtle)' }}>
            {formatDate(item.dueDate)}
          </span>
        )}
      </div>
    </div>
  );
}

// --- Kanban Column (droppable) ---
function KanbanColumn({ status, items }: { status: ActionStatus; items: IActionItem[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div style={{ flex: '1 1 220px', minWidth: 200, maxWidth: 300 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLUMN_COLORS[status] }} />
        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text)' }}>{ACTION_STATUS_LABELS[status]}</span>
        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-subtle)', background: 'var(--surface-3)', padding: '1px 7px', borderRadius: 99 }}>{items.length}</span>
      </div>
      <div
        ref={setNodeRef}
        style={{
          background: isOver ? 'rgba(99,102,241,0.06)' : 'var(--surface)',
          border: `1px solid ${isOver ? 'var(--primary-ring)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-lg)',
          padding: '0.625rem',
          minHeight: 120,
          transition: 'background 0.15s, border-color 0.15s',
        }}
      >
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {items.map((item) => <KanbanCard key={item.id} item={item} />)}
        </SortableContext>
        {items.length === 0 && (
          <div style={{ padding: '1.5rem 0', textAlign: 'center', color: 'var(--text-subtle)', fontSize: '0.8125rem' }}>
            Drop items here
          </div>
        )}
      </div>
    </div>
  );
}

// --- Main Page ---
export default function ActionItemsPage() {
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);
  const [items, setItems] = useState<IActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [activeItem, setActiveItem] = useState<IActionItem | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const workspaceId = activeWorkspace?.id;
  const socket = useSocket(workspaceId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const fetchItems = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const res = await api.get(`/workspaces/${workspaceId}/action-items`);
      setItems(res.data.data ?? []);
    } finally { setLoading(false); }
  }, [workspaceId]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  // Live updates — socket is single source of truth
  useEffect(() => {
    const onMoved = ({ id, status }: { id: string; status: ActionStatus }) =>
      setItems((prev) => prev.map((i) => i.id === id ? { ...i, status } : i));
    const onUpdated = (updated: IActionItem) =>
      setItems((prev) => {
        const exists = prev.some((i) => i.id === updated.id);
        // Dedup new items too — prevents double-add with optimistic onCreated
        return exists ? prev.map((i) => i.id === updated.id ? updated : i) : [updated, ...prev];
      });
    socket.on('action:moved', onMoved);
    socket.on('action:updated', onUpdated);
    return () => { socket.off('action:moved', onMoved); socket.off('action:updated', onUpdated); };
  }, [socket]);

  const onDragStart = (e: DragStartEvent) => {
    setActiveItem(items.find((i) => i.id === e.active.id) ?? null);
  };

  const onDragEnd = async (e: DragEndEvent) => {
    setActiveItem(null);
    const { active, over } = e;
    if (!over || !workspaceId) return;

    const overId = String(over.id);
    const dragged = items.find((i) => i.id === active.id);
    if (!dragged) return;

    // 'over' can be a column ID or another card's ID — resolve to a status
    let targetStatus: ActionStatus;
    if (COLUMNS.includes(overId as ActionStatus)) {
      targetStatus = overId as ActionStatus;
    } else {
      const overItem = items.find((i) => i.id === overId);
      targetStatus = overItem?.status ?? dragged.status;
    }

    if (dragged.status === targetStatus) return;

    // Optimistic update
    setItems((prev) => prev.map((i) => i.id === dragged.id ? { ...i, status: targetStatus } : i));

    try {
      await api.patch(`/workspaces/${workspaceId}/action-items/${dragged.id}`, { status: targetStatus });
    } catch {
      toast.error('Failed to move item');
      // Rollback
      setItems((prev) => prev.map((i) => i.id === dragged.id ? { ...i, status: dragged.status } : i));
    }
  };

  const itemsByStatus = (status: ActionStatus) => items.filter((i) => i.status === status);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ color: 'var(--text)', margin: 0 }}>Action Items</h2>
          <p style={{ margin: 0, fontSize: '0.875rem' }}>{items.length} total items</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', padding: 3, border: '1px solid var(--border)' }}>
            {(['kanban', 'list'] as const).map((v) => (
              <button key={v} onClick={() => setView(v)}
                style={{ background: view === v ? 'var(--primary)' : 'transparent', color: view === v ? '#fff' : 'var(--text-muted)', border: 'none', padding: '0.3rem 0.875rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 500 }}>
                {v === 'kanban' ? '⬛ Board' : '≡ List'}
              </button>
            ))}
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
            New Item
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', gap: '1rem' }}>
          {COLUMNS.map((c) => <div key={c} className="skeleton" style={{ flex: 1, height: 300, borderRadius: 'var(--radius-lg)' }} />)}
        </div>
      ) : view === 'kanban' ? (
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', overflowX: 'auto', paddingBottom: '1rem' }}>
            {COLUMNS.map((status) => (
              <KanbanColumn key={status} status={status} items={itemsByStatus(status)} />
            ))}
          </div>
          <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
            {activeItem ? <KanbanCard item={activeItem} overlay /> : null}
          </DragOverlay>
        </DndContext>
      ) : (
        /* List View */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: 900 }}>
          {items.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">✅</div>
              <h3 className="empty-state-title">No action items yet</h3>
              <button className="btn btn-primary mt-4" onClick={() => setShowCreate(true)}>Create first item</button>
            </div>
          ) : items.map((item) => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.625rem 0.875rem', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: PRIORITY_COLORS[item.priority], flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: '0.875rem', color: 'var(--text)' }}>{item.title}</span>
              <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: 99, background: 'var(--surface-3)', color: 'var(--text-muted)' }}>
                {ACTION_STATUS_LABELS[item.status as ActionStatus]}
              </span>
              {item.assignee && <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#fff', fontWeight: 700 }} title={item.assignee.name}>{item.assignee.name[0]}</div>}
              {item.dueDate && <span style={{ fontSize: '0.75rem', color: isOverdue(item.dueDate) ? 'var(--danger)' : 'var(--text-subtle)' }}>{formatDate(item.dueDate)}</span>}
            </div>
          ))}
        </div>
      )}

      {showCreate && workspaceId && (
        <CreateItemModal
          workspaceId={workspaceId}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            // Socket 'action:updated' is the single source of truth — no optimistic add
            setShowCreate(false);
          }}
        />
      )}
    </div>
  );
}

function CreateItemModal({ workspaceId, onClose, onCreated }: { workspaceId: string; onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      const res = await api.post(`/workspaces/${workspaceId}/action-items`, { title, priority, dueDate: dueDate || null });
      void res; // socket event handles list update
      toast.success('Action item created!');
      onCreated();
    } catch { toast.error('Failed to create item'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">New Action Item</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input id="item-title" className="form-input" placeholder="What needs to be done?" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select id="item-priority" className="form-input" value={priority} onChange={(e) => setPriority(e.target.value)}>
                {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Due date</label>
              <input id="item-due" type="date" className="form-input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" id="create-item-submit" className="btn btn-primary" disabled={loading || !title.trim()}>
              {loading ? 'Creating…' : 'Create item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
