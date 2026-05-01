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

## 🚢 Deployment (Render)

The project ships with a `render.yaml` Blueprint at the repo root — deploy everything in one click.

### One-Click Blueprint Deploy

1. Push your repo to GitHub
2. Go to [render.com](https://render.com) → **New → Blueprint** → connect your repo
3. Render auto-creates: **PostgreSQL** + **API service** + **Web service**

### Set Environment Variables (API service)

```
DATABASE_URL         → auto-injected from Render PostgreSQL
JWT_ACCESS_SECRET    → openssl rand -base64 64
JWT_REFRESH_SECRET   → openssl rand -base64 64
CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET
RESEND_API_KEY
EMAIL_FROM           → WorkNest <onboarding@resend.dev>
CLIENT_URL           → https://worknest-web.onrender.com
NODE_ENV             → production
PORT                 → 4000
```

### Set Environment Variables (Web service)

```
NEXT_PUBLIC_API_URL    → https://worknest-api.onrender.com
NEXT_PUBLIC_SOCKET_URL → https://worknest-api.onrender.com
```

> **Free tier note:** Render free instances spin down after 15 min of inactivity — expect a ~30s cold start on first request. The Render PostgreSQL free tier expires after 90 days; use [Neon](https://neon.tech) or [Supabase](https://supabase.com) for a permanent free database.

Database migrations run automatically on every deploy via `npx prisma migrate deploy`. 🎉

---

## ⭐ Advanced Features

### 1. Real-time Kanban Board with Live Drag-and-Drop Sync

The Action Items board uses **@dnd-kit** for smooth drag-and-drop across status columns (TODO → IN_PROGRESS → IN_REVIEW → DONE). What makes it advanced is the **optimistic + real-time sync layer**:

- **Optimistic UI:** The card moves instantly in the UI before the API call completes, making the interaction feel instantaneous
- **Socket.io broadcast:** When a card is dropped, the API persists the new status and emits an `action:moved` event to the entire workspace room
- **Live sync for collaborators:** Any teammate viewing the same board sees the card animate to its new column in real time — no refresh needed
- **Conflict resolution:** If the API call fails, the card snaps back to its original column with a toast error, keeping the UI consistent

```
User drags card → Optimistic move → API PATCH → Socket emit → All clients update
                        ↓                                              ↑
                  (instant feedback)                      (real-time broadcast)
```

### 2. @Mention System with In-App Notification Pipeline

Comments on announcements support `@username` mentions with a full notification pipeline:

- **Smart autocomplete:** Typing `@` opens a floating picker populated with workspace members — filtered as you type, keyboard-navigable
- **Backend parsing:** The comment service extracts all `@name` patterns, resolves them to user IDs against the workspace members list, and deduplicates
- **Transactional creation:** The comment and all mention notifications are written in a single Prisma transaction — either all succeed or none do
- **Real-time delivery:** Each mentioned user's `user:<id>` Socket.io room receives a `notification:new` event immediately, incrementing their bell badge without a page refresh
- **Persistence:** Notifications are stored in the DB so they survive page reloads and are available in the full notifications page

```
Comment submitted → @mention parsed → Notification records created (DB transaction)
                                              ↓
                              Socket.io → user:<id> room → Live bell badge
```

---

## ⚠️ Known Limitations

| Area | Limitation | Workaround / Future Fix |
|------|------------|------------------------|
| **Free-tier cold starts** | Render free instances sleep after 15 min inactivity; first request takes ~30s | Upgrade to Render Starter ($7/mo) or use a cron ping to keep alive |
| **File upload size** | Avatar uploads capped at 10 MB (Multer limit) | Increase `limit` in `express.json` and Multer config |
| **Socket.io scaling** | Socket.io uses in-memory state — does not scale horizontally across multiple API instances | Add Redis adapter (`@socket.io/redis-adapter`) for multi-instance support |
| **Email deliverability** | Resend `onboarding@resend.dev` sender only delivers to the account owner's verified email in dev mode | Verify a custom domain on Resend for production invitations to any address |
| **Announcement pinning** | Max 3 pinned announcements per workspace (enforced in service layer) | Configurable per-workspace limit is a planned feature |
| **No pagination cursor** | List endpoints use offset pagination which degrades at large data sets | Replace with cursor-based pagination for Goals / Action Items |
| **Presence accuracy** | Presence is tracked per-connection; browser tab close without clean disconnect may show user as online for up to 60s | Add a heartbeat timeout / TTL to presence records |
| **No 2FA** | Authentication is username + password only | TOTP/2FA support is a planned feature |

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
- JWTs stored in **httpOnly, Secure, SameSite=None cookies** — not localStorage
  - `SameSite=None` is required for cross-domain deployments (web + API on separate subdomains); `Secure=true` is enforced in production to mitigate the relaxed SameSite policy
- **Rate limiting**: 20 req/15 min on auth routes, 300 req/15 min general (disabled in development)
- **Helmet** sets security headers (CSP, X-Frame-Options, etc.)
- **CORS** locked to `CLIENT_URL` env variable with `credentials: true`
- Input validated with **Zod** on every API endpoint
- Admin-only routes guarded by `adminGuard` middleware checking workspace role
- **Refresh token rotation**: each token refresh issues a new refresh token and invalidates the old one (stored hashed in DB)

---

## 📄 License

MIT © 2026 WorkNest

---

<div align="center">
  Built with ☕ and TypeScript
</div>
