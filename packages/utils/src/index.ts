import { format, formatDistanceToNow, isAfter } from 'date-fns';

// ---- Date Helpers ----

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'MMM d, yyyy');
}

export function formatDatetime(date: string | Date): string {
  return format(new Date(date), 'MMM d, yyyy h:mm a');
}

export function timeAgo(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function isOverdue(dueDate: string | Date | null): boolean {
  if (!dueDate) return false;
  return isAfter(new Date(), new Date(dueDate));
}

// ---- Slug Generation ----

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ---- Color Helpers ----

export function getContrastColor(hexColor: string): '#000000' | '#ffffff' {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ---- String Helpers ----

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '…';
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// ---- CSV Export ----

export function jsonToCsv<T extends Record<string, unknown>>(
  data: T[],
  columns: { key: keyof T; label: string }[]
): string {
  const header = columns.map((c) => c.label).join(',');
  const rows = data.map((row) =>
    columns
      .map((c) => {
        const value = row[c.key];
        const str = value == null ? '' : String(value);
        return `"${str.replace(/"/g, '""')}"`;
      })
      .join(',')
  );
  return [header, ...rows].join('\n');
}

export function downloadCsv(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// ---- Priority / Status Helpers ----

export const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#22c55e',
  MEDIUM: '#f59e0b',
  HIGH: '#ef4444',
  URGENT: '#7c3aed',
};

export const GOAL_STATUS_COLORS: Record<string, string> = {
  NOT_STARTED: '#6b7280',
  IN_PROGRESS: '#3b82f6',
  COMPLETED: '#22c55e',
  AT_RISK: '#ef4444',
};

export const ACTION_STATUS_LABELS: Record<string, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done',
};
