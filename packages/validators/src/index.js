"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dateStringSchema = exports.actionItemFilterSchema = exports.goalFilterSchema = exports.paginationSchema = exports.updateActionItemSchema = exports.createActionItemSchema = exports.toggleReactionSchema = exports.createCommentSchema = exports.updateAnnouncementSchema = exports.createAnnouncementSchema = exports.updateMilestoneSchema = exports.createMilestoneSchema = exports.updateGoalSchema = exports.createGoalSchema = exports.updateMemberRoleSchema = exports.inviteMemberSchema = exports.updateWorkspaceSchema = exports.createWorkspaceSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
// ---- Auth ----
exports.registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters').max(50),
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Must contain at least one number'),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
// ---- Workspace ----
exports.createWorkspaceSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters').max(50),
    description: zod_1.z.string().max(500).optional(),
    accentColor: zod_1.z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color')
        .default('#6366f1'),
});
exports.updateWorkspaceSchema = exports.createWorkspaceSchema.partial();
exports.inviteMemberSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
});
exports.updateMemberRoleSchema = zod_1.z.object({
    role: zod_1.z.enum(['ADMIN', 'MEMBER']),
});
// ---- Goal ----
exports.createGoalSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required').max(200),
    description: zod_1.z.string().optional(),
    dueDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}(T.*)?$/).optional().nullable(),
    ownerId: zod_1.z.string().optional(), // defaults to current user
});
exports.updateGoalSchema = exports.createGoalSchema
    .partial()
    .extend({
    status: zod_1.z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'AT_RISK']).optional(),
});
// ---- Milestone ----
exports.createMilestoneSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required').max(200),
    dueDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}(T.*)?$/).optional().nullable(),
});
exports.updateMilestoneSchema = exports.createMilestoneSchema
    .partial()
    .extend({ completed: zod_1.z.boolean().optional() });
// ---- Announcement ----
exports.createAnnouncementSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required').max(200),
    content: zod_1.z.string().min(1, 'Content is required'),
});
exports.updateAnnouncementSchema = exports.createAnnouncementSchema.partial();
// ---- Comment ----
exports.createCommentSchema = zod_1.z.object({
    content: zod_1.z.string().min(1, 'Comment cannot be empty').max(2000),
    parentId: zod_1.z.string().optional().nullable(),
});
// ---- Reaction ----
exports.toggleReactionSchema = zod_1.z.object({
    emoji: zod_1.z.string().min(1).max(10),
});
// ---- Action Item ----
exports.createActionItemSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required').max(200),
    priority: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
    status: zod_1.z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']).default('TODO'),
    dueDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}(T.*)?$/).optional().nullable(),
    assigneeId: zod_1.z.string().optional().nullable(),
    goalId: zod_1.z.string().optional().nullable(),
});
exports.updateActionItemSchema = exports.createActionItemSchema.partial();
// ---- Query Params ----
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(20),
});
exports.goalFilterSchema = zod_1.z.object({
    status: zod_1.z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'AT_RISK']).optional(),
    ownerId: zod_1.z.string().optional(),
    search: zod_1.z.string().optional(),
});
exports.actionItemFilterSchema = zod_1.z.object({
    status: zod_1.z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']).optional(),
    priority: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    assigneeId: zod_1.z.string().optional(),
    goalId: zod_1.z.string().optional(),
    search: zod_1.z.string().optional(),
});
// ---- Utility: date string that accepts YYYY-MM-DD (date picker format) ----
// zod .datetime() only accepts ISO 8601 with time; for date-only inputs use this:
exports.dateStringSchema = zod_1.z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}(T.*)?$/, 'Must be a valid date')
    .optional()
    .nullable();
//# sourceMappingURL=index.js.map