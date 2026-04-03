# SlotMatch

An automated interview scheduling platform that streamlines candidate availability collection through rolling 2-week windows, multi-channel notifications, and a clean admin dashboard.

## Features

- **Candidate Management** - Add, pause, archive, and track candidates with real-time status
- **2-Week Availability Windows** - Rolling date windows with interactive drag-to-select calendar for candidates
- **Automated Notifications** - Configurable cron-based availability requests and reminders via Email (SendGrid) and SMS (RingCentral)
- **Per-Window Scheduling Links** - Generate and share links scoped to specific date windows
- **Availability History** - View all past submissions per candidate, grouped by window
- **External API** - Query candidate availability programmatically with API key authentication
- **Admin Dashboard** - Stats, candidate countdowns, notification scheduling, and API key management

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL + Prisma 7 |
| Auth | NextAuth 5 + JWT |
| Email | SendGrid |
| SMS | RingCentral |
| Scheduling | node-cron |
| Styling | Tailwind CSS 4 |
| Validation | Zod |

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL

### Setup

1. **Clone and install**
   ```bash
   git clone <repo-url>
   cd slotmatch
   npm install
   ```

2. **Configure environment** - Create a `.env` file:
   ```env
   # Database
   DATABASE_URL="postgresql://user@localhost:5432/slotmatch"

   # App
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   NEXT_PUBLIC_TIMEZONE="America/Chicago"
   NODE_ENV="development"

   # Auth
   JWT_SECRET="change-me-to-a-random-64-char-string"
   NEXTAUTH_SECRET="change-me-to-a-random-64-char-string"
   NEXTAUTH_URL="http://localhost:3000"

   # SendGrid (Email)
   SENDGRID_API_KEY=""
   SENDGRID_FROM_EMAIL=""

   # RingCentral (SMS) - optional
   RINGCENTRAL_SERVER_URL="https://platform.devtest.ringcentral.com"
   RINGCENTRAL_CLIENT_ID=""
   RINGCENTRAL_CLIENT_SECRET=""
   RINGCENTRAL_JWT_TOKEN=""

   # Scheduling
   CRON_ENABLED="true"
   ```

3. **Set up the database**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

4. **Start the dev server**
   ```bash
   npm run dev
   ```

5. **Log in** at `http://localhost:3000` with:
   - Email: `admin@slotmatch.com`
   - Password: `admin123!`

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Generate Prisma client + build for production |
| `npm run start` | Run migrations + start production server |
| `npm run lint` | Run ESLint |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:push` | Push schema directly (no migration) |
| `npm run db:seed` | Seed demo admin and sample candidates |
| `npm run db:studio` | Open Prisma Studio GUI |

## Project Structure

```
src/
├── app/
│   ├── (admin)/                  # Admin dashboard pages
│   │   ├── dashboard/            # Stats + candidate countdowns
│   │   ├── candidates/           # List + detail views
│   │   ├── notifications/        # Schedule configuration
│   │   └── api-keys/             # API key management
│   ├── (candidate)/
│   │   └── schedule/[token]/     # Candidate availability form
│   ├── auth/login/               # Admin login
│   └── api/                      # API routes
│       ├── candidates/           # CRUD + send-request, copy-link, generate-link
│       ├── availability/[token]/ # Candidate token-based access
│       ├── notifications/        # Schedule + manual triggers
│       ├── external/             # Public API (Bearer token auth)
│       └── admin/auth/           # Login, logout, session
├── lib/
│   ├── notifications/            # Email + SMS services
│   ├── scheduler/                # Cron job configuration
│   ├── windows.ts                # Availability window logic
│   ├── timezone.ts               # CST/CDT formatting utilities
│   ├── tokens.ts                 # JWT generation + verification
│   └── validations/              # Zod schemas
└── components/ui/                # Reusable UI components
```

## Data Model

- **Admin** - Single admin account per instance
- **Candidate** - Email, phone, name, status (Active / Paused / Archived)
- **AvailabilityWindow** - 2-week rolling periods with JWT token access (Open / Submitted / Expired)
- **TimeSlot** - Individual date + time ranges within a window
- **NotificationSchedule** - Admin-configurable cron settings for requests and reminders
- **NotificationLog** - Audit trail of all email, SMS, and system events
- **ApiKey** - Hashed keys with scopes and expiration

## External API

Query submitted availability via `GET /api/external/availability` with a Bearer token:

```bash
curl -H "Authorization: Bearer sm_your_api_key" \
  "https://your-app.com/api/external/availability?email=jane@example.com"
```

See `docs/API_GUIDE.md` for full documentation with examples.

## Deployment

The app is configured for Railway deployment:

```bash
# Build command
prisma generate && next build

# Start command
prisma migrate deploy && next start
```

Set all environment variables in your Railway service. `NEXT_PUBLIC_APP_URL` should point to your production domain, and `NEXT_PUBLIC_TIMEZONE` controls the display timezone (defaults to `America/Chicago`).

## Notes

- Email and SMS run in mock mode when API keys are not configured (logs to console)
- Non-predefined admin accounts are auto-cleaned on startup
- Candidate access is token-based with no password required
- All times display in the configured timezone (CST/CDT by default)
