export declare function formatDate(date: string | Date): string;
export declare function formatDatetime(date: string | Date): string;
export declare function timeAgo(date: string | Date): string;
export declare function isOverdue(dueDate: string | Date | null): boolean;
export declare function generateSlug(text: string): string;
export declare function getContrastColor(hexColor: string): '#000000' | '#ffffff';
export declare function hexToRgba(hex: string, alpha: number): string;
export declare function truncate(text: string, maxLength: number): string;
export declare function getInitials(name: string): string;
export declare function jsonToCsv<T extends Record<string, unknown>>(data: T[], columns: {
    key: keyof T;
    label: string;
}[]): string;
export declare function downloadCsv(csv: string, filename: string): void;
export declare const PRIORITY_COLORS: Record<string, string>;
export declare const GOAL_STATUS_COLORS: Record<string, string>;
export declare const ACTION_STATUS_LABELS: Record<string, string>;
//# sourceMappingURL=index.d.ts.map