'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createWorkspaceSchema, type CreateWorkspaceInput } from '@worknest/validators';
import { useWorkspaceStore } from '@/store/workspace.store';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const PRESET_COLORS = ['#6366f1','#8b5cf6','#ec4899','#ef4444','#f59e0b','#22c55e','#14b8a6','#3b82f6'];

export default function CreateWorkspaceModal({ onClose }: { onClose: () => void }) {
  const { createWorkspace } = useWorkspaceStore();
  const router = useRouter();
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<CreateWorkspaceInput>({
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: { accentColor: PRESET_COLORS[0] },
  });

  const onSubmit = async (data: CreateWorkspaceInput) => {
    setIsLoading(true);
    try {
      const ws = await createWorkspace({ ...data, accentColor: selectedColor });
      toast.success(`Workspace "${ws.name}" created!`);
      router.push(`/workspace/${ws.slug}`);
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to create workspace';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Create workspace</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Workspace name</label>
            <input id="ws-name" type="text" className={`form-input ${errors.name ? 'error' : ''}`} placeholder="e.g. Acme Corp" {...register('name')} />
            {errors.name && <span className="form-error">{errors.name.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Description <span style={{ color: 'var(--text-subtle)' }}>(optional)</span></label>
            <textarea id="ws-desc" className="form-input" rows={2} placeholder="What does this workspace focus on?" {...register('description')} style={{ resize: 'vertical' }} />
          </div>

          <div className="form-group">
            <label className="form-label">Accent color</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {PRESET_COLORS.map((color) => (
                <button
                  key={color} type="button"
                  onClick={() => setSelectedColor(color)}
                  style={{ width: 28, height: 28, borderRadius: '50%', background: color, border: selectedColor === color ? '3px solid white' : '3px solid transparent', cursor: 'pointer', boxShadow: selectedColor === color ? `0 0 0 2px ${color}` : 'none', transition: 'all 0.15s' }}
                />
              ))}
            </div>
          </div>

          <div className="modal-footer" style={{ padding: 0, margin: 0, border: 0 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" id="create-workspace-submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'Creating…' : 'Create workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
