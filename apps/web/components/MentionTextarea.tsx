'use client';
import { useState, useRef, useCallback } from 'react';
import { getInitials } from '@worknest/utils';

export interface MentionMember {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  members: MentionMember[];
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
}

export default function MentionTextarea({
  value, onChange, onSubmit, members, placeholder = 'Write a comment… use @ to mention', disabled, rows = 2,
}: MentionTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [picker, setPicker] = useState<{ query: string; start: number } | null>(null);
  const [selected, setSelected] = useState(0);

  const filtered = picker
    ? members.filter((m) => m.name.toLowerCase().includes(picker.query.toLowerCase())).slice(0, 6)
    : [];

  // Detect @ typed in textarea
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    onChange(text);

    const cursor = e.target.selectionStart ?? 0;
    // Look backwards from cursor for an @ that hasn't been closed by space
    const before = text.slice(0, cursor);
    const match = before.match(/@([\w\s]{0,30})$/);
    if (match) {
      setPicker({ query: match[1], start: cursor - match[0].length });
      setSelected(0);
    } else {
      setPicker(null);
    }
  }, [onChange]);

  const insertMention = useCallback((member: MentionMember) => {
    if (!picker || !ref.current) return;
    const before = value.slice(0, picker.start);
    const after = value.slice(ref.current.selectionStart ?? picker.start);
    const mention = `@${member.name} `;
    const newValue = before + mention + after;
    onChange(newValue);
    setPicker(null);
    // Move cursor after mention
    requestAnimationFrame(() => {
      if (ref.current) {
        const pos = before.length + mention.length;
        ref.current.setSelectionRange(pos, pos);
        ref.current.focus();
      }
    });
  }, [picker, value, onChange]);

  // Keyboard nav for picker
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (picker && filtered.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected((s) => Math.min(s + 1, filtered.length - 1)); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); return; }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); insertMention(filtered[selected]); return; }
      if (e.key === 'Escape') { setPicker(null); return; }
    }
    if (e.key === 'Enter' && !e.shiftKey && !picker) {
      e.preventDefault();
      onSubmit();
    }
  }, [picker, filtered, selected, insertMention, onSubmit]);

  return (
    <div style={{ position: 'relative', flex: 1 }}>
      <textarea
        ref={ref}
        className="form-input"
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        style={{ resize: 'none', width: '100%' }}
      />

      {/* Mention picker dropdown */}
      {picker && filtered.length > 0 && (
        <div style={{
          position: 'absolute', bottom: '100%', left: 0, right: 0, marginBottom: 4,
          background: 'var(--surface-2)', border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)', zIndex: 300,
          overflow: 'hidden',
        }}>
          <div style={{ padding: '0.375rem 0.625rem', fontSize: '0.7rem', color: 'var(--text-subtle)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--border)' }}>
            Mention a teammate
          </div>
          {filtered.map((m, i) => (
            <button
              key={m.id}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); insertMention(m); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.625rem',
                padding: '0.5rem 0.75rem', width: '100%', border: 'none', textAlign: 'left', cursor: 'pointer',
                background: i === selected ? 'var(--primary-muted)' : 'transparent',
                color: i === selected ? 'var(--primary)' : 'var(--text)',
                transition: 'background 0.1s',
              }}
              onMouseEnter={() => setSelected(i)}
            >
              <div className="avatar avatar-sm">
                {m.avatarUrl ? <img src={m.avatarUrl} alt="" /> : getInitials(m.name)}
              </div>
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{m.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Render comment text with @mentions highlighted as purple chips */
export function renderWithMentions(text: string) {
  const parts = text.split(/(@[\w][\w\s]{1,29}?)(?=\s|$|[^a-zA-Z0-9_\s])/g);
  return parts.map((part, i) =>
    part.startsWith('@') ? (
      <mark key={i} style={{ background: 'var(--primary-muted)', color: 'var(--primary)', borderRadius: 4, padding: '1px 4px', fontWeight: 600, fontStyle: 'normal' }}>
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}
