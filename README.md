# OpenClass

Open-source course, attendance, and payment management platform for independent teachers.

Built with Next.js 15, Prisma, PostgreSQL, and next-intl (Arabic/English).

---

## Features

- **Teacher dashboard** — manage courses, semesters, sessions, students, and payments from one place
- **Guest student booking** — students book a course via the teacher's public page using name + phone only (no account required)
- **QR attendance** — generate per-session QR codes; students scan in/out
- **Monthly payments** — track cash payments per student per month; approve or flag as pending
- **Teacher-owned levels** — each teacher defines their own level progression
- **Bilingual UI** — full Arabic (RTL) and English (LTR) support with a one-click switcher
- **Parent dashboard** — parents track their child's attendance and payment status

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database
- `.env` file with `DATABASE_URL` and `NEXTAUTH_SECRET` (see `.env.example`)

### First-time setup

```bash
cp .env.example .env
# fill in DATABASE_URL and NEXTAUTH_SECRET in .env

bash scripts/setup.sh
npm run dev
```

`scripts/setup.sh` runs:
1. `npm install`
2. `prisma generate`
3. `prisma migrate deploy`

### Development

```bash
npm run dev        # start dev server on http://localhost:3000
npm run build      # production build
npm test           # run tests
```

### Database migrations (ongoing)

```bash
npx prisma migrate dev --name <migration-name>   # create + apply new migration
npx prisma migrate deploy                         # apply pending migrations (production)
npx prisma studio                                 # visual DB browser
```

---

## Project Structure

```
src/
  app/                        # Next.js App Router pages and server actions
    dashboard/
      teacher/                # Teacher dashboard (courses, students, levels, profile)
      admin/                  # Admin dashboard (levels, parent links)
      student/                # Student dashboard
      parent/                 # Parent dashboard
    t/[teacherId]/            # Public teacher booking page
    login/ register/          # Auth pages
  modules/                    # Domain modules (DDD-style)
    auth/                     # User authentication and profiles
    courses/                  # Course management
    levels/                   # Level progression (per teacher)
    students/                 # Student management
    semesters/                # Semester management
    scheduling/               # Class sessions and bulk scheduling
    attendance/               # QR attendance tracking
    payments/                 # Monthly payment tracking
    roster/                   # Student roster with filters
    family/                   # Parent-student links
  i18n/                       # Locale config, language switcher
  shared/                     # Shared utilities and infrastructure
prisma/
  schema.prisma               # Database schema
  migrations/                 # Migration history
scripts/
  setup.sh                    # First-time install script
tests/                        # Unit tests per module
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Secret for NextAuth session signing |
| `NEXTAUTH_URL` | Base URL of the app (e.g. `http://localhost:3000`) |

See `.env.example` for the full list.

---

## License

MIT — free to use, fork, and self-host.
