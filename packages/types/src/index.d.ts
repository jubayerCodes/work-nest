export type Role = 'ADMIN' | 'MEMBER';
export type GoalStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'AT_RISK';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type ActionStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
export interface IUser {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
    createdAt: string;
    updatedAt: string;
}
export interface IWorkspace {
    id: string;
    name: string;
    description: string | null;
    accentColor: string;
    slug: string;
    createdAt: string;
    updatedAt: string;
    role?: Role;
}
export interface IWorkspaceMember {
    id: string;
    role: Role;
    joinedAt: string;
    user: IUser;
}
export interface IInvitation {
    id: string;
    email: string;
    expiresAt: string;
    accepted: boolean;
    workspaceId: string;
}
export interface IGoal {
    id: string;
    title: string;
    description: string | null;
    status: GoalStatus;
    dueDate: string | null;
    createdAt: string;
    updatedAt: string;
    owner: IUser;
    workspaceId: string;
    milestones?: IMilestone[];
    _count?: {
        milestones: number;
        actionItems: number;
    };
}
export interface IMilestone {
    id: string;
    title: string;
    completed: boolean;
    dueDate: string | null;
    goalId: string;
}
export interface IAnnouncement {
    id: string;
    title: string;
    content: string;
    pinned: boolean;
    publishedAt: string;
    updatedAt: string;
    authorId: string;
    author?: IUser;
    workspaceId: string;
    reactions?: IReaction[];
    comments?: IComment[];
    _count?: {
        comments: number;
    };
}
export interface IReaction {
    id: string;
    emoji: string;
    userId: string;
    announcementId: string;
    user?: IUser;
}
export interface IComment {
    id: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    author: IUser;
    announcementId: string;
    parentId: string | null;
    replies?: IComment[];
    mentions?: IMention[];
}
export interface IMention {
    id: string;
    userId: string;
    commentId: string;
    user?: IUser;
}
export interface IActionItem {
    id: string;
    title: string;
    priority: Priority;
    status: ActionStatus;
    dueDate: string | null;
    createdAt: string;
    updatedAt: string;
    assignee: IUser | null;
    workspaceId: string;
    goalId: string | null;
    goal?: Pick<IGoal, 'id' | 'title'> | null;
}
export interface IActivity {
    id: string;
    type: string;
    payload: Record<string, unknown>;
    createdAt: string;
    actorId: string;
    actor?: IUser;
    goalId: string | null;
}
export interface INotification {
    id: string;
    type: string;
    payload: Record<string, unknown>;
    read: boolean;
    createdAt: string;
    userId: string;
}
export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}
export interface PaginatedResponse<T> {
    success: boolean;
    message: string;
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}
export interface IAuthUser extends IUser {
    memberships: {
        workspaceId: string;
        role: Role;
        workspace: IWorkspace;
    }[];
}
export interface ILoginResponse {
    user: IAuthUser;
}
export interface IAnalytics {
    goalsByStatus: Record<GoalStatus, number>;
    actionItemsByStatus: Record<ActionStatus, number>;
    overdueActionItems: number;
    completionRate: number;
    trend: {
        date: string;
        completed: number;
    }[];
    topAssignees: {
        user: IUser;
        completedCount: number;
    }[];
}
export interface ServerToClientEvents {
    'announcement:new': (data: IAnnouncement) => void;
    'announcement:updated': (data: IAnnouncement) => void;
    'announcement:deleted': (data: {
        id: string;
    }) => void;
    'announcement:pinned': (data: {
        id: string;
        pinned: boolean;
    }) => void;
    'comment:new': (data: IComment) => void;
    'comment:updated': (data: IComment) => void;
    'comment:deleted': (data: {
        id: string;
        announcementId: string;
    }) => void;
    'reaction:toggled': (data: {
        announcementId: string;
        reactions: IReaction[];
    }) => void;
    'goal:updated': (data: IGoal) => void;
    'milestone:updated': (data: IMilestone) => void;
    'action:updated': (data: IActionItem) => void;
    'action:moved': (data: {
        id: string;
        status: ActionStatus;
    }) => void;
    'notification:new': (data: INotification) => void;
    'presence:online': (data: {
        userIds: string[];
    }) => void;
    'presence:join': (data: {
        userId: string;
    }) => void;
    'presence:leave': (data: {
        userId: string;
    }) => void;
}
export interface ClientToServerEvents {
    'workspace:join': (workspaceId: string) => void;
    'workspace:leave': (workspaceId: string) => void;
}
//# sourceMappingURL=index.d.ts.map