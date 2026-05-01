'use client';
import { useEffect, useState, useCallback } from 'react';
import { useWorkspaceStore } from '@/store/workspace.store';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import type { IAnnouncement, IComment } from '@worknest/types';
import { timeAgo } from '@worknest/utils';
import toast from 'react-hot-toast';
import { useSocket } from '@/hooks/useSocket';
import MentionTextarea, { renderWithMentions, type MentionMember } from '@/components/MentionTextarea';

const QUICK_EMOJIS = ['👍', '❤️', '🎉', '🚀', '👀', '✅'];

export default function AnnouncementsPage() {
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);
  const user = useAuthStore((s) => s.user);
  const [announcements, setAnnouncements] = useState<IAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, IComment[]>>({});
  const [members, setMembers] = useState<MentionMember[]>([]);

  const workspaceId = activeWorkspace?.id;
  const isAdmin = user?.memberships?.some((m) => m.workspace.id === workspaceId && m.role === 'ADMIN');
  const socket = useSocket(workspaceId);

  const fetchAnnouncements = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const [annRes, membersRes] = await Promise.all([
        api.get(`/workspaces/${workspaceId}/announcements`),
        api.get(`/workspaces/${workspaceId}`),
      ]);
      setAnnouncements(annRes.data.data ?? []);
      // Extract members for @mention picker (exclude self)
      const allMembers: { user: MentionMember }[] = membersRes.data.data?.members ?? [];
      setMembers(allMembers.map((m) => m.user).filter((m) => m.id !== user?.id));
    } finally { setLoading(false); }
  }, [workspaceId, user?.id]);

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

  // Real-time — socket is the single source of truth for list updates
  useEffect(() => {
    const onNew = (ann: IAnnouncement) =>
      setAnnouncements((p) => p.some((a) => a.id === ann.id) ? p : [ann, ...p]);
    const onUpdate = (ann: IAnnouncement) =>
      setAnnouncements((p) => p.map((a) => a.id === ann.id ? ann : a));
    const onDelete = ({ id }: { id: string }) =>
      setAnnouncements((p) => p.filter((a) => a.id !== id));
    const onReaction = ({ announcementId, reactions }: { announcementId: string; reactions: IAnnouncement['reactions'] }) =>
      setAnnouncements((p) => p.map((a) => a.id === announcementId ? { ...a, reactions } : a));
    const onComment = (comment: IComment) =>
      setComments((p) => ({
        ...p,
        [comment.announcementId]: p[comment.announcementId]?.some((c) => c.id === comment.id)
          ? p[comment.announcementId]
          : [...(p[comment.announcementId] ?? []), comment],
      }));

    socket.on('announcement:new', onNew);
    socket.on('announcement:updated', onUpdate);
    socket.on('announcement:deleted', onDelete);
    socket.on('reaction:toggled', onReaction);
    socket.on('comment:new', onComment);

    return () => {
      // Always pass the exact handler to off() — avoids removing other components' listeners
      socket.off('announcement:new', onNew);
      socket.off('announcement:updated', onUpdate);
      socket.off('announcement:deleted', onDelete);
      socket.off('reaction:toggled', onReaction);
      socket.off('comment:new', onComment);
    };
  }, [socket]);

  const expandAnnouncement = async (id: string) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (!comments[id] && workspaceId) {
      const res = await api.get(`/workspaces/${workspaceId}/announcements/${id}`);
      setComments((p) => ({ ...p, [id]: res.data.data.comments ?? [] }));
    }
  };

  const toggleReaction = async (announcementId: string, emoji: string) => {
    if (!workspaceId) return;
    await api.post(`/workspaces/${workspaceId}/announcements/${announcementId}/reactions`, { emoji });
  };

  const togglePin = async (ann: IAnnouncement) => {
    if (!workspaceId) return;
    try {
      await api.patch(`/workspaces/${workspaceId}/announcements/${ann.id}/pin`, { pinned: !ann.pinned });
      setAnnouncements((p) => p.map((a) => a.id === ann.id ? { ...a, pinned: !a.pinned } : a));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to pin';
      toast.error(msg);
    }
  };

  const pinned = announcements.filter((a) => a.pinned);
  const unpinned = announcements.filter((a) => !a.pinned);

  return (
    <div style={{ maxWidth: 780 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ color: 'var(--text)', margin: 0 }}>Announcements</h2>
          <p style={{ margin: 0, fontSize: '0.875rem' }}>Team-wide updates and news</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            Post Announcement
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 'var(--radius-lg)' }} />)}
        </div>
      ) : announcements.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📢</div>
          <h3 className="empty-state-title">No announcements yet</h3>
          <p className="empty-state-desc">{isAdmin ? 'Post your first announcement to the team.' : 'Check back later for team updates.'}</p>
          {isAdmin && <button className="btn btn-primary mt-4" onClick={() => setShowCreate(true)}>Post first announcement</button>}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Pinned */}
          {pinned.length > 0 && (
            <>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>📌 Pinned</div>
              {pinned.map((ann) => <AnnouncementCard key={ann.id} ann={ann} isAdmin={!!isAdmin} userId={user?.id} workspaceId={workspaceId!} expanded={expanded === ann.id} comments={comments[ann.id] ?? []} members={members} onExpand={() => expandAnnouncement(ann.id)} onReact={toggleReaction} onPin={togglePin} onCommentsUpdate={(c) => setComments((p) => ({ ...p, [ann.id]: c }))} />)}
              <div className="divider" />
            </>
          )}
          {unpinned.map((ann) => (
            <AnnouncementCard key={ann.id} ann={ann} isAdmin={!!isAdmin} userId={user?.id} workspaceId={workspaceId!} expanded={expanded === ann.id} comments={comments[ann.id] ?? []} members={members} onExpand={() => expandAnnouncement(ann.id)} onReact={toggleReaction} onPin={togglePin} onCommentsUpdate={(c) => setComments((p) => ({ ...p, [ann.id]: c }))} />
          ))}
        </div>
      )}

      {showCreate && workspaceId && (
        <CreateAnnouncementModal
          workspaceId={workspaceId}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            // Socket 'announcement:new' is the single source of truth — no optimistic add needed
            setShowCreate(false);
            toast.success('Announcement posted!');
          }}
        />
      )}
    </div>
  );
}

function AnnouncementCard({ ann, isAdmin, userId, workspaceId, expanded, comments, members, onExpand, onReact, onPin, onCommentsUpdate }:
  { ann: IAnnouncement; isAdmin: boolean; userId?: string; workspaceId: string; expanded: boolean; comments: IComment[]; members: MentionMember[]; onExpand: () => void; onReact: (id: string, emoji: string) => void; onPin: (ann: IAnnouncement) => void; onCommentsUpdate: (c: IComment[]) => void }) {

  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reactionMap = new Map<string, { count: number; reacted: boolean }>();
  ann.reactions?.forEach((r) => {
    const cur = reactionMap.get(r.emoji) ?? { count: 0, reacted: false };
    reactionMap.set(r.emoji, { count: cur.count + 1, reacted: cur.reacted || r.userId === userId });
  });

  const submitComment = async () => {
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      // Socket 'comment:new' is the source of truth — no optimistic add
      await api.post(`/workspaces/${workspaceId}/announcements/${ann.id}/comments`, { content: commentText });
      setCommentText('');
    } catch { toast.error('Failed to post comment'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="card" style={{ borderColor: ann.pinned ? 'rgba(99,102,241,0.3)' : 'var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ color: 'var(--text)', margin: '0 0 0.5rem', fontSize: '1.0625rem' }}>{ann.title}</h3>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.875rem' }}>
            {timeAgo(ann.publishedAt)}
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.7 }}
            dangerouslySetInnerHTML={{ __html: ann.content.slice(0, expanded ? undefined : 300) + (!expanded && ann.content.length > 300 ? '…' : '') }}
          />
        </div>
        {isAdmin && (
          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => onPin(ann)} title={ann.pinned ? 'Unpin' : 'Pin'} style={{ color: ann.pinned ? 'var(--primary)' : 'var(--text-muted)' }}>
            📌
          </button>
        )}
      </div>

      {/* Reactions */}
      <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.875rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {Array.from(reactionMap.entries()).map(([emoji, { count, reacted }]) => (
          <button key={emoji} onClick={() => onReact(ann.id, emoji)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '2px 8px', borderRadius: 99, background: reacted ? 'var(--primary-muted)' : 'var(--surface-2)', border: `1px solid ${reacted ? 'var(--primary-ring)' : 'var(--border)'}`, cursor: 'pointer', fontSize: '0.8125rem', color: reacted ? 'var(--primary)' : 'var(--text-muted)' }}>
            {emoji} <span>{count}</span>
          </button>
        ))}
        {/* Quick emoji picker */}
        {QUICK_EMOJIS.map((e) => !reactionMap.has(e) && (
          <button key={e} onClick={() => onReact(ann.id, e)}
            style={{ padding: '2px 6px', borderRadius: 99, background: 'transparent', border: '1px dashed var(--border)', cursor: 'pointer', fontSize: '0.8125rem', opacity: 0.5, transition: 'opacity 0.15s' }}
            onMouseEnter={(el) => (el.currentTarget.style.opacity = '1')}
            onMouseLeave={(el) => (el.currentTarget.style.opacity = '0.5')}>
            {e}
          </button>
        ))}
      </div>

      {/* Expand / Comments toggle */}
      <button className="btn btn-ghost btn-sm" onClick={onExpand} style={{ marginTop: '0.875rem', color: 'var(--primary)', padding: '0.25rem 0' }}>
        {expanded ? '▲ Collapse' : `▼ Comments (${ann._count?.comments ?? 0})`}
      </button>

      {/* Comments section */}
      {expanded && (
        <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
          {comments.map((c) => (
            <div key={c.id} style={{ display: 'flex', gap: '0.625rem', marginBottom: '0.875rem' }}>
              <div className="avatar avatar-sm">{c.author.avatarUrl ? <img src={c.author.avatarUrl} alt="" /> : c.author.name[0]}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.8125rem' }}>
                  <strong style={{ color: 'var(--text)' }}>{c.author.name}</strong>{' '}
                  <span style={{ color: 'var(--text-subtle)' }}>{timeAgo(c.createdAt)}</span>
                </div>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  {renderWithMentions(c.content)}
                </p>
                {c.replies && c.replies.length > 0 && (
                  <div style={{ marginTop: '0.5rem', paddingLeft: '1rem', borderLeft: '2px solid var(--border)' }}>
                    {c.replies.map((r) => (
                      <div key={r.id} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <div className="avatar avatar-sm">{r.author.avatarUrl ? <img src={r.author.avatarUrl} alt="" /> : r.author.name[0]}</div>
                        <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                          <strong style={{ color: 'var(--text)' }}>{r.author.name}</strong>: {renderWithMentions(r.content)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', alignItems: 'flex-end' }}>
            <MentionTextarea
              value={commentText}
              onChange={setCommentText}
              onSubmit={submitComment}
              members={members}
              placeholder="Write a comment… type @ to mention a teammate"
            />
            <button className="btn btn-primary btn-sm" onClick={submitComment} disabled={submitting || !commentText.trim()} style={{ flexShrink: 0 }}>Post</button>
          </div>
        </div>
      )}
    </div>
  );
}

function CreateAnnouncementModal({ workspaceId, onClose, onCreated }: { workspaceId: string; onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setLoading(true);
    try {
      const res = await api.post(`/workspaces/${workspaceId}/announcements`, { title, content });
      void res; // socket event handles the list update
      onCreated();
    } catch { toast.error('Failed to post announcement'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 600 }}>
        <div className="modal-header">
          <h2 className="modal-title">New Announcement</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input id="ann-title" className="form-input" placeholder="e.g. Q2 Planning Update" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Content *</label>
            <textarea id="ann-content" className="form-input" rows={6} placeholder="Write your announcement…" value={content} onChange={(e) => setContent(e.target.value)} style={{ resize: 'vertical' }} />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" id="post-announcement-submit" className="btn btn-primary" disabled={loading || !title.trim() || !content.trim()}>{loading ? 'Posting…' : 'Post announcement'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
