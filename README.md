<div align="center">

<img src="https://img.shields.io/badge/WorkNest-Collaborative%20Hub-6366f1?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB4PSIzIiB5PSIzIiB3aWR0aD0iNyIgaGVpZ2h0PSI3IiByeD0iMS41IiBmaWxsPSJ3aGl0ZSIvPjxyZWN0IHg9IjE0IiB5PSIzIiB3aWR0aD0iNyIgaGVpZ2h0PSI3IiByeD0iMS41IiBmaWxsPSJ3aGl0ZSIvPjxyZWN0IHg9IjMiIHk9IjE0IiB3aWR0aD0iNyIgaGVpZ2h0PSI3IiByeD0iMS41IiBmaWxsPSJ3aGl0ZSIvPjxyZWN0IHg9IjE0IiB5PSIxNCIgd2lkdGg9IjciIGhlaWdodD0iNyIgcng9IjEuNSIgZmlsbD0id2hpdGUiLz48L3N2Zz4=" />

# WorkNest

**A real-time collaborative workspace hub for teams**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![Express](https://img.shields.io/badge/Express-5-000000?style=flat-square&logo=express)](https://expressjs.com)
[![Socket.io](https://img.shields.io/badge/Socket.io-4-010101?style=flat-square&logo=socket.io)](https://socket.io)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=flat-square&logo=prisma)](https://prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql)](https://postgresql.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![pnpm](https://img.shields.io/badge/pnpm-9-F69220?style=flat-square&logo=pnpm)](https://pnpm.io)

[Features](#-features) · [Tech Stack](#-tech-stack) · [Getting Started](#-getting-started) · [Environment Variables](#-environment-variables) · [Deployment](#-deployment)

</div>

---

## ✨ Features

| Module | Highlights |
|--------|-----------|
| 🔐 **Auth** | JWT (access + refresh) with httpOnly cookies, bcrypt passwords, rate limiting |
| 🏢 **Workspaces** | Create/switch workspaces, invite members via email, role management (Admin / Member) |
| 🎯 **Goals** | Create goals with milestones, track progress, activity feed, status updates |
| ✅ **Action Items** | Kanban board with drag-and-drop, list view toggle, priority levels, due dates |
| 📢 **Announcements** | Rich posts with emoji reactions, threaded comments, pinning (max 3) |
| 💬 **@Mentions** | Type `@` in comments to mention teammates — triggers instant in-app notifications |
| 🔔 **Notifications** | Real-time bell badge, notification panel, mark-read, full notifications page |
| 👤 **Profile** | Avatar upload via Cloudinary, name editing, workspace membership overview |
| 📊 **Analytics** | Workspace overview with Recharts pie + area charts, metric cards |
| 🟢 **Presence** | Online/offline indicators powered by Socket.io presence rooms |

---

## 🏗 Tech Stack

### Monorepo Structure

```
worknest/
├── apps/
│   ├── api/          # Express 5 + Socket.io + Prisma
│   └── web/          # Next.js 15 App Router
└── packages/
    ├── types/        # Shared TypeScript interfaces
    ├── validators/   # Shared Zod schemas
    └── utils/        # Pure helper functions
```

### Backend (`apps/api`)
- **Runtime:** Node.js 20+, TypeScript
- **Framework:** Express 5
- **Database ORM:** Prisma 6 (PostgreSQL)
- **Real-time:** Socket.io 4 (workspace rooms + personal `user:<id>` rooms)
- **Auth:** JWT (jsonwebtoken) + bcryptjs + httpOnly cookies
- **File Uploads:** Multer (memory storage) → Cloudinary
- **Email:** Resend
- **Security:** helmet, cors, express-rate-limit, Zod validation

### Frontend (`apps/web`)
- **Framework:** Next.js 15 App Router
- **State:** Zustand (auth, workspace, notification, presence stores)
- **HTTP Client:** Axios with automatic token refresh interceptor
- **Real-time:** Socket.io-client singleton
- **Forms:** react-hook-form + Zod + @hookform/resolvers
- **Drag & Drop:** @dnd-kit/core + @dnd-kit/sortable
- **Charts:** Recharts
- **Toasts:** react-hot-toast
- **Styling:** Vanilla CSS with dark-mode design system

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 20.0.0
- **pnpm** ≥ 9.0.0 — `npm install -g pnpm`
- **PostgreSQL** running locally (or a connection URL)

### 1. Clone & Install

```bash
git clone https://github.com/your-username/worknest.git
cd worknest
pnpm install
```

### 2. Set Up Environment Variables

Copy the example files and fill in your values:

```bash
cp .env.example apps/api/.env
```

Create `apps/web/.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
JWT_ACCESS_SECRET=your-same-secret-as-api
```

See the [Environment Variables](#-environment-variables) section for full details.

### 3. Set Up the Database

```bash
# Run migrations
pnpm --filter @worknest/api prisma migrate dev

# (Optional) Seed with sample data
pnpm --filter @worknest/api prisma:seed
```

### 4. Start Development

```bash
pnpm dev
```

This starts both services in parallel via Turborepo:

| Service | URL |
|---------|-----|
| Web (Next.js) | http://localhost:3000 |
| API (Express) | http://localhost:4000 |

---

## 🔑 Environment Variables

### `apps/api/.env`

```env
# PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/worknest"

# JWT — generate with: openssl rand -base64 32
JWT_ACCESS_SECRET="your-32-char-secret"
JWT_REFRESH_SECRET="your-other-32-char-secret"
JWT_ACCESS_EXPIRES_IN="1d"
JWT_REFRESH_EXPIRES_IN="7d"

# Cloudinary (https://cloudinary.com/console)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Resend Email (https://resend.com/api-keys)
# For testing, use: onboarding@resend.dev (sends only to your verified Resend email)
RESEND_API_KEY="re_xxxxxxxxxxxx"
EMAIL_FROM="WorkNest <onboarding@resend.dev>"

# App
CLIENT_URL="http://localhost:3000"
PORT=4000
NODE_ENV="development"
```

### `apps/web/.env.local`

```env
NEXT_PUBLIC_API_URL="http://localhost:4000"
NEXT_PUBLIC_SOCKET_URL="http://localhost:4000"
JWT_ACCESS_SECRET="your-same-secret-as-api"
```

> **Note:** `EMAIL_FROM` must use the format `Name <email@domain.com>`. Gmail addresses are not supported by Resend — use `onboarding@resend.dev` for development, or verify your own domain for production.

---

## 🗄 Database Schema

Key models (see full schema in `apps/api/prisma/schema.prisma`):

```
User → WorkspaceMember → Workspace
Workspace → Goal → Milestone
Workspace → ActionItem (assignee: User)
Workspace → Announcement → Reaction, Comment → Mention
User → Notification
User → UserPreference
```

---

## 🧩 API Reference

All routes are prefixed with `/api`.

### Auth
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/auth/register` | Create account |
| `POST` | `/auth/login` | Login + set cookies |
| `POST` | `/auth/refresh` | Refresh access token |
| `POST` | `/auth/logout` | Clear cookies |
| `GET` | `/auth/me` | Current user profile |

### Workspaces
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/workspaces` | My workspaces |
| `POST` | `/workspaces` | Create workspace |
| `GET` | `/workspaces/:id` | Workspace details + members |
| `PATCH` | `/workspaces/:id` | Update (Admin) |
| `POST` | `/workspaces/:id/members/invite` | Invite by email (Admin) |
| `GET` | `/workspaces/invitations/:token` | Preview invite (public) |
| `POST` | `/workspaces/invitations/accept` | Accept invite |
| `DELETE` | `/workspaces/:id/members/:userId` | Remove member (Admin) |
| `PATCH` | `/workspaces/:id/members/:userId/role` | Change role (Admin) |

### Goals & Action Items
| Method | Path | Description |
|--------|------|-------------|
| `GET/POST` | `/workspaces/:id/goals` | List / create goals |
| `GET/PATCH/DELETE` | `/workspaces/:id/goals/:goalId` | Goal detail / update / delete |
| `POST` | `/workspaces/:id/goals/:goalId/milestones` | Add milestone |
| `GET/POST` | `/workspaces/:id/action-items` | List / create action items |
| `PATCH/DELETE` | `/workspaces/:id/action-items/:itemId` | Update / delete item |

### Announcements
| Method | Path | Description |
|--------|------|-------------|
| `GET/POST` | `/workspaces/:id/announcements` | List / create (Admin) |
| `PATCH` | `/workspaces/:id/announcements/:annId/pin` | Pin / unpin (Admin) |
| `POST` | `/workspaces/:id/announcements/:annId/reactions` | Toggle emoji reaction |
| `POST` | `/workspaces/:id/announcements/:annId/comments` | Add comment (supports `@mentions`) |

### Users & Notifications
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/users/me` | Full profile + memberships |
| `PATCH` | `/users/profile` | Update name |
| `POST` | `/users/avatar` | Upload avatar |
| `GET` | `/notifications` | My notifications |
| `PATCH` | `/notifications/:id/read` | Mark one read |
| `PATCH` | `/notifications/read-all` | Mark all read |

---

## ⚡ Real-time Events (Socket.io)

Clients join a workspace room by emitting `workspace:join`. Each user also automatically joins their personal `user:<id>` room.

| Event | Direction | Payload |
|-------|-----------|---------|
| `workspace:join` | Client → Server | `workspaceId` |
| `presence:online` | Server → Room | `{ userId, name }` |
| `presence:offline` | Server → Room | `{ userId }` |
| `goal:updated` | Server → Room | `IGoal` |
| `action:moved` | Server → Room | `{ id, status }` |
| `action:updated` | Server → Room | `IActionItem` |
| `announcement:new` | Server → Room | `IAnnouncement` |
| `announcement:updated` | Server → Room | `IAnnouncement` |
| `announcement:deleted` | Server → Room | `{ id }` |
| `reaction:toggled` | Server → Room | `{ announcementId, reactions }` |
| `comment:new` | Server → Room | `IComment` |
| `notification:new` | Server → `user:<id>` | `INotification` |

---

## 🚢 Deployment (Railway)

Both services are Railway-ready with `railway.json` configuration files.

### Step 1 — Create Services

1. New project → **Add Service → GitHub Repo** (select `WorkNest`)
2. Add **two services**: one for `apps/api`, one for `apps/web`
3. Add a **PostgreSQL plugin** to the API service — `DATABASE_URL` is injected automatically

### Step 2 — Set Environment Variables

**API service variables:**
```
DATABASE_URL         → (auto-injected by Railway Postgres plugin)
JWT_ACCESS_SECRET    → your secret
JWT_REFRESH_SECRET   → your other secret
CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET
RESEND_API_KEY
EMAIL_FROM           → WorkNest <noreply@yourdomain.com>
CLIENT_URL           → https://your-web-service.railway.app
NODE_ENV             → production
PORT                 → 4000
```

**Web service variables:**
```
NEXT_PUBLIC_API_URL    → https://your-api-service.railway.app
NEXT_PUBLIC_SOCKET_URL → https://your-api-service.railway.app
JWT_ACCESS_SECRET      → same as API
```

### Step 3 — Deploy

Railway will:
- **API:** Run `npx prisma migrate deploy && node dist/index.js`
- **Web:** Run `node server.js` (Next.js standalone output)

Database migrations run automatically on every deploy. 🎉

---

## 🛠 Development Scripts

```bash
# Start everything
pnpm dev

# Type-check all packages
pnpm typecheck

# Lint all packages
pnpm lint

# Build all packages (production)
pnpm build

# Prisma commands (run inside apps/api)
pnpm --filter @worknest/api prisma migrate dev    # Create + apply migration
pnpm --filter @worknest/api prisma studio         # Open Prisma Studio (DB GUI)
pnpm --filter @worknest/api prisma:seed           # Seed with sample data
```

---

## 📁 Project Structure

```
worknest/
├── apps/
│   ├── api/
│   │   ├── prisma/
│   │   │   ├── schema.prisma        # Database schema (13 models)
│   │   │   └── seed.ts
│   │   └── src/
│   │       ├── config/              # env validation, Prisma client, Cloudinary
│   │       ├── middleware/          # auth, error handler, upload (multer)
│   │       ├── modules/
│   │       │   ├── auth/
│   │       │   ├── users/
│   │       │   ├── workspaces/
│   │       │   ├── goals/
│   │       │   ├── action-items/
│   │       │   ├── announcements/   # @mention parsing lives here
│   │       │   ├── notifications/
│   │       │   └── analytics/
│   │       ├── realtime/
│   │       │   └── socket.ts        # Socket.io setup + workspace/user rooms
│   │       └── services/
│   │           ├── cloudinary.service.ts
│   │           └── email.service.ts
│   └── web/
│       ├── app/
│       │   ├── (auth)/              # login, register
│       │   ├── (dashboard)/
│       │   │   ├── layout.tsx       # Auth guard + socket boot
│       │   │   ├── profile/
│       │   │   └── workspace/[workspaceSlug]/
│       │   │       ├── page.tsx     # Analytics overview
│       │   │       ├── goals/
│       │   │       ├── action-items/
│       │   │       ├── announcements/
│       │   │       ├── notifications/
│       │   │       └── settings/
│       │   └── invite/              # Invitation acceptance page
│       ├── components/
│       │   ├── layout/              # Sidebar, Header, WorkspaceSwitcher
│       │   ├── notifications/       # NotificationPanel dropdown
│       │   └── MentionTextarea.tsx  # @mention picker component
│       ├── hooks/
│       │   └── useSocket.ts
│       ├── lib/
│       │   ├── api.ts               # Axios + refresh interceptor
│       │   └── socket.ts            # Socket.io singleton
│       └── store/
│           ├── auth.store.ts
│           ├── workspace.store.ts
│           ├── notification.store.ts
│           └── presence.store.ts
└── packages/
    ├── types/src/index.ts           # IUser, IWorkspace, IGoal, IActionItem…
    ├── validators/src/index.ts      # Zod schemas shared by API + web
    └── utils/src/index.ts           # timeAgo, getInitials, generateSlug…
```

---

## 🔒 Security

- Passwords hashed with **bcrypt** (cost factor 12)
- JWTs stored in **httpOnly, Secure, SameSite=Strict cookies** — not localStorage
- **Rate limiting**: 20 req/15 min on auth routes, 300 req/15 min general (disabled in development)
- **Helmet** sets security headers (CSP, X-Frame-Options, etc.)
- **CORS** locked to `CLIENT_URL` env variable
- Input validated with **Zod** on every API endpoint
- Admin-only routes guarded by `adminGuard` middleware checking workspace role

---

## 📄 License

MIT © 2026 WorkNest

---

<div align="center">
  Built with ☕ and TypeScript
</div>
