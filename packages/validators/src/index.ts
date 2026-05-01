import { z } from 'zod';

// ---- Auth ----

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

// ---- Workspace ----

export const createWorkspaceSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  description: z.string().max(500).optional(),
  accentColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color')
    .default('#6366f1'),
});

export const updateWorkspaceSchema = createWorkspaceSchema.partial();

export const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(['ADMIN', 'MEMBER']),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

// ---- Goal ----

export const createGoalSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}(T.*)?$/).optional().nullable(),
  ownerId: z.string().optional(), // defaults to current user
});

export const updateGoalSchema = createGoalSchema
  .partial()
  .extend({
    status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'AT_RISK']).optional(),
  });

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;

// ---- Milestone ----

export const createMilestoneSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}(T.*)?$/).optional().nullable(),
});

export const updateMilestoneSchema = createMilestoneSchema
  .partial()
  .extend({ completed: z.boolean().optional() });

export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>;
export type UpdateMilestoneInput = z.infer<typeof updateMilestoneSchema>;

// ---- Announcement ----

export const createAnnouncementSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().min(1, 'Content is required'),
});

export const updateAnnouncementSchema = createAnnouncementSchema.partial();

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;

// ---- Comment ----

export const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(2000),
  parentId: z.string().optional().nullable(),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

// ---- Reaction ----

export const toggleReactionSchema = z.object({
  emoji: z.string().min(1).max(10),
});

export type ToggleReactionInput = z.infer<typeof toggleReactionSchema>;

// ---- Action Item ----

export const createActionItemSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']).default('TODO'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}(T.*)?$/).optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  goalId: z.string().optional().nullable(),
});

export const updateActionItemSchema = createActionItemSchema.partial();

export type CreateActionItemInput = z.infer<typeof createActionItemSchema>;
export type UpdateActionItemInput = z.infer<typeof updateActionItemSchema>;

// ---- Query Params ----

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const goalFilterSchema = z.object({
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'AT_RISK']).optional(),
  ownerId: z.string().optional(),
  search: z.string().optional(),
});

export const actionItemFilterSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assigneeId: z.string().optional(),
  goalId: z.string().optional(),
  search: z.string().optional(),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
export type GoalFilterInput = z.infer<typeof goalFilterSchema>;
export type ActionItemFilterInput = z.infer<typeof actionItemFilterSchema>;

// ---- Utility: date string that accepts YYYY-MM-DD (date picker format) ----
// zod .datetime() only accepts ISO 8601 with time; for date-only inputs use this:
export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}(T.*)?$/, 'Must be a valid date')
  .optional()
  .nullable();
