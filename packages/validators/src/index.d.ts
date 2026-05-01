import { z } from 'zod';
export declare const registerSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    email: string;
    password: string;
}, {
    name: string;
    email: string;
    password: string;
}>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export declare const createWorkspaceSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    accentColor: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    accentColor: string;
    description?: string | undefined;
}, {
    name: string;
    accentColor: string;
    description?: string | undefined;
}>;
export declare const updateWorkspaceSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    accentColor: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
    accentColor?: string | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    accentColor?: string | undefined;
}>;
export declare const inviteMemberSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export declare const updateMemberRoleSchema: z.ZodObject<{
    role: z.ZodEnum<["ADMIN", "MEMBER"]>;
}, "strip", z.ZodTypeAny, {
    role: "ADMIN" | "MEMBER";
}, {
    role: "ADMIN" | "MEMBER";
}>;
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export declare const createGoalSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    dueDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    ownerId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    title: string;
    description?: string | undefined;
    dueDate?: string | null | undefined;
    ownerId?: string | undefined;
}, {
    title: string;
    description?: string | undefined;
    dueDate?: string | null | undefined;
    ownerId?: string | undefined;
}>;
export declare const updateGoalSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    dueDate: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    ownerId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
} & {
    status: z.ZodOptional<z.ZodEnum<["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "AT_RISK"]>>;
}, "strip", z.ZodTypeAny, {
    status?: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "AT_RISK" | undefined;
    description?: string | undefined;
    title?: string | undefined;
    dueDate?: string | null | undefined;
    ownerId?: string | undefined;
}, {
    status?: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "AT_RISK" | undefined;
    description?: string | undefined;
    title?: string | undefined;
    dueDate?: string | null | undefined;
    ownerId?: string | undefined;
}>;
export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
export declare const createMilestoneSchema: z.ZodObject<{
    title: z.ZodString;
    dueDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    title: string;
    dueDate?: string | null | undefined;
}, {
    title: string;
    dueDate?: string | null | undefined;
}>;
export declare const updateMilestoneSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    dueDate: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
} & {
    completed: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    title?: string | undefined;
    dueDate?: string | null | undefined;
    completed?: boolean | undefined;
}, {
    title?: string | undefined;
    dueDate?: string | null | undefined;
    completed?: boolean | undefined;
}>;
export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>;
export type UpdateMilestoneInput = z.infer<typeof updateMilestoneSchema>;
export declare const createAnnouncementSchema: z.ZodObject<{
    title: z.ZodString;
    content: z.ZodString;
}, "strip", z.ZodTypeAny, {
    title: string;
    content: string;
}, {
    title: string;
    content: string;
}>;
export declare const updateAnnouncementSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    title?: string | undefined;
    content?: string | undefined;
}, {
    title?: string | undefined;
    content?: string | undefined;
}>;
export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;
export declare const createCommentSchema: z.ZodObject<{
    content: z.ZodString;
    parentId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    content: string;
    parentId?: string | null | undefined;
}, {
    content: string;
    parentId?: string | null | undefined;
}>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export declare const toggleReactionSchema: z.ZodObject<{
    emoji: z.ZodString;
}, "strip", z.ZodTypeAny, {
    emoji: string;
}, {
    emoji: string;
}>;
export type ToggleReactionInput = z.infer<typeof toggleReactionSchema>;
export declare const createActionItemSchema: z.ZodObject<{
    title: z.ZodString;
    priority: z.ZodDefault<z.ZodEnum<["LOW", "MEDIUM", "HIGH", "URGENT"]>>;
    status: z.ZodDefault<z.ZodEnum<["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]>>;
    dueDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    assigneeId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    goalId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    status: "IN_PROGRESS" | "TODO" | "IN_REVIEW" | "DONE";
    title: string;
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    dueDate?: string | null | undefined;
    assigneeId?: string | null | undefined;
    goalId?: string | null | undefined;
}, {
    title: string;
    status?: "IN_PROGRESS" | "TODO" | "IN_REVIEW" | "DONE" | undefined;
    dueDate?: string | null | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
    assigneeId?: string | null | undefined;
    goalId?: string | null | undefined;
}>;
export declare const updateActionItemSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    priority: z.ZodOptional<z.ZodDefault<z.ZodEnum<["LOW", "MEDIUM", "HIGH", "URGENT"]>>>;
    status: z.ZodOptional<z.ZodDefault<z.ZodEnum<["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]>>>;
    dueDate: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    assigneeId: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    goalId: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
}, "strip", z.ZodTypeAny, {
    status?: "IN_PROGRESS" | "TODO" | "IN_REVIEW" | "DONE" | undefined;
    title?: string | undefined;
    dueDate?: string | null | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
    assigneeId?: string | null | undefined;
    goalId?: string | null | undefined;
}, {
    status?: "IN_PROGRESS" | "TODO" | "IN_REVIEW" | "DONE" | undefined;
    title?: string | undefined;
    dueDate?: string | null | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
    assigneeId?: string | null | undefined;
    goalId?: string | null | undefined;
}>;
export type CreateActionItemInput = z.infer<typeof createActionItemSchema>;
export type UpdateActionItemInput = z.infer<typeof updateActionItemSchema>;
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
}, {
    page?: number | undefined;
    limit?: number | undefined;
}>;
export declare const goalFilterSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "AT_RISK"]>>;
    ownerId: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status?: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "AT_RISK" | undefined;
    ownerId?: string | undefined;
    search?: string | undefined;
}, {
    status?: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "AT_RISK" | undefined;
    ownerId?: string | undefined;
    search?: string | undefined;
}>;
export declare const actionItemFilterSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]>>;
    priority: z.ZodOptional<z.ZodEnum<["LOW", "MEDIUM", "HIGH", "URGENT"]>>;
    assigneeId: z.ZodOptional<z.ZodString>;
    goalId: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status?: "IN_PROGRESS" | "TODO" | "IN_REVIEW" | "DONE" | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
    assigneeId?: string | undefined;
    goalId?: string | undefined;
    search?: string | undefined;
}, {
    status?: "IN_PROGRESS" | "TODO" | "IN_REVIEW" | "DONE" | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
    assigneeId?: string | undefined;
    goalId?: string | undefined;
    search?: string | undefined;
}>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type GoalFilterInput = z.infer<typeof goalFilterSchema>;
export type ActionItemFilterInput = z.infer<typeof actionItemFilterSchema>;
export declare const dateStringSchema: z.ZodNullable<z.ZodOptional<z.ZodString>>;
//# sourceMappingURL=index.d.ts.map