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
- **Recorded courses** — upload video lessons against existing courses; they are transcoded to HLS and streamed to enrolled students through short-lived, per-viewer playback authorizations

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database
- `.env` file with `DATABASE_URL` and `NEXTAUTH_SECRET` (see `.env.example`)
- **FFmpeg and FFprobe** on `PATH` (required only for recorded courses — see below)

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

## Recorded Courses

Video lessons attached to the **existing** courses. Nothing about the Courses system changes:
a recorded video always belongs to one course, and access to it is whatever the course
already grants.

### How it fits together

```
Course (existing)
  └── RecordedVideo (title, description, position, DRAFT|PUBLISHED)
        └── VideoAsset (original file, HLS renditions, thumbnail, duration, processing state)

User ──> LessonProgress ──> RecordedVideo
```

### Admin flow

1. Create the course in **Courses** as usual.
2. Go to **Recorded courses** (teacher/admin sidebar) or a course's **Recordings** page.
3. Add a recorded video: title, description, course, status, and the video file.
   The file is uploaded in 8 MiB chunks to a private endpoint, with a live progress bar.
4. Processing runs in the background. The list shows `Queued → Processing → Ready`,
   or `Processing failed` with a **Retry** action.
5. Drag lessons on the course's Recordings page to reorder them; the order is persisted
   as a dense `position` sequence.

### Student flow

Students do **not** have passwords. They open the public **`/student-portal`** route and enter
their student **code number** (`User.idNumber`) — the same number the parent portal and the QR
codes use.

```
/student-portal            enter code number → course list with progress
/student-portal/courses/{courseId}/lessons            → first unfinished lesson
/student-portal/courses/{courseId}/lessons/{videoId}  → player
```

**Identity precedence:** both a staff session and a portal session can exist in one browser (a
teacher signed into the dashboard who then opens the portal with a student code). Watching —
`/play`, `/progress` and segment delivery — always resolves the **portal** identity first, so
the student's progress is recorded against the student. Management surfaces are staff-only and
never accept a portal session. Keeping these two in step matters: when they disagree the portal
renders one student's lessons while progress is written to another account, and the course bar
can never complete.

The code is verified once server-side and exchanged for a signed, httpOnly, 12-hour session
cookie. The code number itself never appears in a URL, so a lesson link cannot be forwarded as
a permanent pass to someone's videos. From there: lesson list with completion marks, an HLS
player with resume-from-last-position, previous/next navigation, and a course progress bar.
Progress is saved every 15 s, on pause, on end and on leaving the page.

### Who may watch

Course access comes from the existing enrolment **and payment** tables — the portal adds no
access rules of its own, and the code number alone never authorizes playback. Three conditions
must all hold:

1. **Enrolled** — the student holds an enrolment in one of the course's semesters.
2. **Started** — that semester's `startDate` has passed. A course beginning next month, or in
   three months, opens on its start date and not before, however early the student enrolled or
   paid.
3. **Paid** — the payment is `APPROVED`. On a recurring (`MONTHLY`) course that means the
   *current* month specifically: last month's payment buys last month, and access lapses the
   moment a new month begins unpaid. `ONE_TIME` and `PER_SEMESTER` courses are satisfied by any
   approved payment.

A `PENDING` payment does not count — only `APPROVED` does, so an unverified transfer never
unlocks a video. The rule lives in one place, `decideCourseAccess`, and is enforced on every
playback and progress request, not just in the UI.

Locked courses are still listed in the portal with the reason ("locked until your payment for
August is confirmed", "opens on 1 November") rather than being hidden, so students know what to
do. Teachers and admins preview their own courses without any payment check.

### Storage layout

Everything lives under `MEDIA_ROOT`, which **must be outside `public/`** so Next.js never
serves any of it statically:

```
$MEDIA_ROOT/
  uploads/<uploadId>/part                 # in-flight chunked uploads
  videos/<assetId>/original.<ext>         # original upload — never served to anyone
  videos/<assetId>/hls/master.m3u8        # ABR master playlist
  videos/<assetId>/hls/v0/playlist.m3u8   # variant playlists + segments
  videos/<assetId>/thumbnail.jpg
```

`MediaStorage` is an interface; `LocalMediaStorage` is the disk implementation. An S3/MinIO
adapter (and with it presigned direct-to-storage uploads and a CDN) can be added by
implementing that one interface — no caller changes.

### Streaming and security

```
Student → GET /api/recorded-videos/{id}/play
            ├── signed in?  enrolled?  course active?  lesson published?  processing done?
            └── HMAC token bound to { asset, lesson, viewer, expiry }
          → GET /api/video/{assetId}/master.m3u8?t=…
            └── playlist rewritten so every variant and segment carries the same token
          → GET /api/video/{assetId}/v0/segment-001.ts?t=…
```

- Original files are never exposed; only generated HLS output is reachable, and only through
  an authorized route.
- Playlists **and** segments require the token — securing only `master.m3u8` is the classic
  half-measure and is explicitly avoided here.
- Tokens expire after `PLAYBACK_TOKEN_TTL_SECONDS` (default 5 min) and are re-issued in the
  background while watching. They are also bound to the signed-in session, so a copied URL is
  useless to anyone else.
- Playback authorization is rate limited per user, and code-number sign-in is rate limited per
  client — tightly, since it is unauthenticated and guessable by construction.
- Uploads are validated by magic bytes, not by extension or declared MIME type.
- Storage credentials and paths never reach the browser.

**What this does not do:** it prevents casual downloading and URL sharing. It cannot prevent
screen recording, capture via developer tools, or a determined user reassembling segments.
A per-viewer watermark is displayed to discourage redistribution and make leaks traceable.
The design leaves room for AES-128 HLS encryption, signed cookies or DRM later without
restructuring.

### Background processing

There is no external queue service, so processing runs in an in-process worker
(`InProcessVideoQueue`) draining a FIFO off the request path. Durability lives in the
database: `src/instrumentation.ts` runs on every server boot, sweeps abandoned upload
directories, resets assets stranded in `PROCESSING`, and re-queues everything still
`PENDING`. Swapping in Redis/BullMQ or a separate worker process means implementing the
`VideoProcessingQueue` interface.

### FFmpeg

Transcoding shells out to FFmpeg and FFprobe. Install them on any node that runs the worker:

```bash
# macOS
brew install ffmpeg
# Debian/Ubuntu
apt-get install -y ffmpeg
```

Each video produces an H.264/AAC HLS ladder (360p / 480p / 720p / 1080p, never upscaled),
6-second segments, a master playlist, a poster frame and the authoritative duration.

### Deployment checklist

- [ ] `MEDIA_ROOT` points at persistent storage **outside** `public/`, writable by the app user
- [ ] FFmpeg + FFprobe installed on nodes where `VIDEO_WORKER_ENABLED` is not `false`
- [ ] `VIDEO_SECRET` set (falls back to `AUTH_SECRET`)
- [ ] `npx prisma migrate deploy` run for the `add_recorded_videos` migration
- [ ] Reverse proxy allows request bodies of at least 16 MiB (the chunk size ceiling) and
      does not buffer `/api/video/*` responses
- [ ] Web server does **not** serve `MEDIA_ROOT` directly
- [ ] Transcoding is CPU-heavy: give the worker node headroom, or run web and worker nodes
      separately with `VIDEO_WORKER_ENABLED=false` on the web tier
- [ ] No cron job is required; recovery happens on boot
- [ ] `MEDIA_ROOT` inside the repo must stay excluded from `tsconfig.json`, ESLint and Prettier:
      HLS segments are `.ts` files (MPEG transport streams, not TypeScript)

---

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Secret for NextAuth session signing |
| `NEXTAUTH_URL` | Base URL of the app (e.g. `http://localhost:3000`) |
| `MEDIA_ROOT` | Private media root for original videos and generated HLS. Must be outside `public/`. Default `./storage/media` |
| `VIDEO_SECRET` | HMAC key for playback tokens. Defaults to `AUTH_SECRET` |
| `FFMPEG_PATH` / `FFPROBE_PATH` | Binary paths. Default `ffmpeg` / `ffprobe` |
| `MAX_VIDEO_UPLOAD_BYTES` | Ceiling for a single upload. Default 2 GiB |
| `PLAYBACK_TOKEN_TTL_SECONDS` | Playback authorization lifetime. Default 300 |
| `LESSON_COMPLETION_THRESHOLD` | Percentage that marks a lesson complete. Default 92 |
| `VIDEO_WORKER_ENABLED` | Set to `false` on nodes that should not transcode |

See `.env.example` for the full list.

---

## License

MIT — free to use, fork, and self-host.
