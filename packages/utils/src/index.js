"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ACTION_STATUS_LABELS = exports.GOAL_STATUS_COLORS = exports.PRIORITY_COLORS = void 0;
exports.formatDate = formatDate;
exports.formatDatetime = formatDatetime;
exports.timeAgo = timeAgo;
exports.isOverdue = isOverdue;
exports.generateSlug = generateSlug;
exports.getContrastColor = getContrastColor;
exports.hexToRgba = hexToRgba;
exports.truncate = truncate;
exports.getInitials = getInitials;
exports.jsonToCsv = jsonToCsv;
exports.downloadCsv = downloadCsv;
const date_fns_1 = require("date-fns");
// ---- Date Helpers ----
function formatDate(date) {
    return (0, date_fns_1.format)(new Date(date), 'MMM d, yyyy');
}
function formatDatetime(date) {
    return (0, date_fns_1.format)(new Date(date), 'MMM d, yyyy h:mm a');
}
function timeAgo(date) {
    return (0, date_fns_1.formatDistanceToNow)(new Date(date), { addSuffix: true });
}
function isOverdue(dueDate) {
    if (!dueDate)
        return false;
    return (0, date_fns_1.isAfter)(new Date(), new Date(dueDate));
}
// ---- Slug Generation ----
function generateSlug(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
// ---- Color Helpers ----
function getContrastColor(hexColor) {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
}
function hexToRgba(hex, alpha) {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
// ---- String Helpers ----
function truncate(text, maxLength) {
    if (text.length <= maxLength)
        return text;
    return text.slice(0, maxLength).trim() + '…';
}
function getInitials(name) {
    return name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}
// ---- CSV Export ----
function jsonToCsv(data, columns) {
    const header = columns.map((c) => c.label).join(',');
    const rows = data.map((row) => columns
        .map((c) => {
        const value = row[c.key];
        const str = value == null ? '' : String(value);
        return `"${str.replace(/"/g, '""')}"`;
    })
        .join(','));
    return [header, ...rows].join('\n');
}
function downloadCsv(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}
// ---- Priority / Status Helpers ----
exports.PRIORITY_COLORS = {
    LOW: '#22c55e',
    MEDIUM: '#f59e0b',
    HIGH: '#ef4444',
    URGENT: '#7c3aed',
};
exports.GOAL_STATUS_COLORS = {
    NOT_STARTED: '#6b7280',
    IN_PROGRESS: '#3b82f6',
    COMPLETED: '#22c55e',
    AT_RISK: '#ef4444',
};
exports.ACTION_STATUS_LABELS = {
    TODO: 'To Do',
    IN_PROGRESS: 'In Progress',
    IN_REVIEW: 'In Review',
    DONE: 'Done',
};
//# sourceMappingURL=index.js.map