# Campus Connect

**Buy · Sell · Rent · Exchange** — a university-verified marketplace for students, faculty, and staff.

This is the **Node.js / Express edition** of Campus Connect: a full-stack web app with a real database, session-based authentication, university-email verification, image uploads, and a REST API behind every feature. Nothing here is a static mockup — every button is wired to a working backend route.

> Built as an MCA Software Engineering project. Designed to be simple enough for a student team to read end-to-end, and complete enough to demo live in front of a class.

---

## 1. Project Overview

Campus Connect lets verified members of a university community:

- Buy, sell, rent, and exchange items with each other
- Chat directly with a buyer/seller before committing
- Send and track buy/rent/exchange **requests** through a pending → accepted → completed workflow
- Save items to a wishlist
- Rate and review each other after a completed trade
- Browse campus events (fests, flea markets, swap meets)
- Post and accept off-campus **errand requests** ("bring me X from the city")
- Get notified about all of the above
- Report bad listings, moderated through an admin dashboard

The university-verification step is what separates this from a generic OLX/Facebook Marketplace clone: registration requires an email on the university's own domain, followed by an OTP-style verification step.

---

## 2. Features

| Area | What's implemented |
|---|---|
| **Auth** | Register, login, logout, session persistence, university-domain email check, OTP verification (Demo Mode — see below) |
| **Marketplace** | Search (title/description), filter (category, type, price range, condition, location, date posted), sort (newest/oldest/price), pagination — all via real DB queries |
| **Listings** | Create/edit/delete (owner-only), multi-image upload, categories, Buy/Sell/Rent/Exchange types |
| **Wishlist** | Add/remove, duplicate-proof |
| **Chat** | Per-listing conversations, persisted messages, unread counts, polling refresh |
| **Transactions** | Request → Accept/Reject → both-sides-confirm → Completed, with cancel at any pending stage |
| **Reviews** | 1–5 star + comment, one review per user per transaction, rolls up into a running average |
| **Notifications** | In-app feed + navbar badge, "mark all as read" |
| **Events** | Public listing page; admin-only create/edit/delete; notifies verified users on creation |
| **Errands** | Post/accept/complete/cancel workflow with a safety disclaimer |
| **Reports & Moderation** | Users report listings; admins triage reports and remove listings |
| **Admin Dashboard** | Stats cards, category/transaction-type breakdown charts, user suspension, listing removal |
| **Security** | bcrypt password hashing, server-side session auth, role-based access control, ownership checks on every mutation, file-type/size validated uploads, no stack traces leaked to users |

---

## 3. Technology Stack

- **Backend:** Node.js, Express
- **Database:** Sequelize ORM — **SQLite by default** (zero setup) or **MySQL** (see [Database Setup](#6-database-setup))
- **Auth:** express-session (DB-backed sessions) + bcryptjs
- **Views:** EJS (server-rendered pages) + vanilla JavaScript (fetches the REST API for all dynamic behavior — no frontend build step, no framework)
- **Uploads:** Multer, validated by file type/size
- **Styling:** hand-written CSS design system (no Bootstrap/Tailwind) in a blue campus palette

---

## 4. Folder Structure

```
campus-connect-node/
├── models/            Sequelize models + associations (models/index.js)
├── routes/             
│   ├── auth.js, listings.js, wishlist.js, chat.js, transactions.js,
│   │   reviews.js, notifications.js, events.js, errands.js, reports.js,
│   │   admin.js        → REST API, mounted under /api/...
│   └── pages.js         → server-rendered page routes (EJS views)
├── middleware/auth.js   loadUser / loginRequired / adminRequired / verifiedRequired
├── utils/helpers.js     OTP, Multer config, university-email check
├── views/                EJS templates (one per page — see Section 29 of the spec)
│   ├── partials/         header.ejs / footer.ejs (shared navbar + footer)
│   ├── admin/             admin dashboard/users/listings/reports/events
│   └── errors/            404 / 403 / 500
├── public/
│   ├── css/style.css     the whole design system
│   └── js/main.js        shared fetch/toast/notification helpers
├── uploads/               uploaded listing photos + avatars (git-ignored)
├── data/                  SQLite database file lives here in demo mode (git-ignored)
├── tests/test_app.js      integration smoke tests (npm test)
├── seed.js                demo data seeder (npm run seed)
├── server.js              app entrypoint
├── config.js              central env-driven configuration
├── schema.sql             equivalent raw MySQL DDL for the same schema
├── .env.example
└── package.json
```

---

## 5. Requirements

- **Node.js 18+** and npm (comes with Node)
- MySQL 8+ **only if** you want the full MySQL setup instead of the zero-config SQLite demo mode

Check your Node version:

```bash
node --version
```

---

## 6. Database Setup

Campus Connect uses Sequelize, so the application code is identical either way — only `DB_DIALECT` in `.env` changes.

### Option A — Quick Demo (SQLite, recommended for grading/presentation)

Nothing to install. The app creates a SQLite file at `data/campus_connect.sqlite` automatically the first time it runs. This is the default in `.env.example`.

### Option B — Full MySQL Setup

1. Install MySQL and create a database:
   ```sql
   CREATE DATABASE campus_connect;
   ```
2. (Optional) Apply the reference schema directly instead of letting Sequelize create tables:
   ```bash
   mysql -u root -p campus_connect < schema.sql
   ```
3. In `.env`, set:
   ```
   DB_DIALECT=mysql
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=campus_connect
   DB_USER=root
   DB_PASSWORD=your_password
   ```

Either way, the app auto-creates any missing tables on startup via `sequelize.sync()`, and `npm run seed` works identically against both.

---

## 7. Installation (Windows)

```bash
cd campus-connect-node
npm install
copy .env.example .env
```

Edit `.env` if you want MySQL instead of the SQLite default (see above). The defaults work out of the box.

## Installation (macOS/Linux)

```bash
cd campus-connect-node
npm install
cp .env.example .env
```

---

## 8. Environment Variables

All defined in `.env.example`:

| Variable | Purpose |
|---|---|
| `PORT` | Port the server listens on (default `3000`) |
| `SESSION_SECRET` | Signs session cookies — change this for anything beyond local demo use |
| `DB_DIALECT` | `sqlite` (default) or `mysql` |
| `DB_STORAGE` | SQLite file path (dialect=sqlite only) |
| `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` | MySQL connection (dialect=mysql only) |
| `UNIVERSITY_EMAIL_DOMAIN` | The only email domain allowed to register (e.g. `cuk.ac.in`) |
| `DEMO_MODE` | When `true`, OTP codes are returned in the API response / shown on-screen instead of emailed |
| `DEMO_OTP_CODE` | The fixed code used in demo mode (default `123456`) |
| `UPLOAD_FOLDER` | Where listing/profile images are stored on disk |
| `MAX_UPLOAD_MB` | Per-file upload size limit |

---

## 9. Seed Demo Data

```bash
npm run seed
```

This **wipes and recreates** all tables, then populates:
- 12 marketplace categories
- 5 demo accounts (below), all pre-verified except one (to demonstrate the unverified state)
- 12 realistic sample listings across categories
- A sample chat conversation with messages
- A completed transaction with a review
- A pending transaction request
- 4 campus events (mix of upcoming/past)
- An open errand request
- A few starter notifications

Run this any time you want to reset the app to a clean demo state.

---

## 10. Running the Application

```bash
npm start
```

Or, for auto-restart on file changes during development:

```bash
npm run dev
```

Then open **http://localhost:3000**

---

## 11. Demo Accounts

| Role | Email | Password |
|---|---|---|
| Student | `student@cuk.ac.in` | `Student@123` |
| Admin | `admin@cuk.ac.in` | `Admin@123` |
| Student (extra) | `rohan@cuk.ac.in` | `Student@123` |
| Faculty | `priya@cuk.ac.in` | `Student@123` |
| Staff (unverified) | `sam@cuk.ac.in` | `Student@123` |

These are development-only credentials seeded for demo/grading purposes — clearly not for production use.

**Registering a brand-new account?** Use any email ending in `@cuk.ac.in` (or whatever you set `UNIVERSITY_EMAIL_DOMAIN` to). In Demo Mode, the verification screen shows the OTP directly on-screen (default `123456`) so you don't need a real mail server to complete the flow.

---

## 12. Testing the Main User Flow

1. Go to `/register`, sign up with `you@cuk.ac.in`
2. You're redirected to `/verify` — the demo OTP is shown right on the page; enter it
3. Land on `/marketplace` — browse, search "textbook", filter by category
4. Open any listing → **Chat with Seller** or **Request to Buy/Rent/Exchange**
5. Log in as the seller (e.g. `student@cuk.ac.in`) in another browser/incognito window → see the request under `/transactions` → **Accept**
6. Both sides click **Mark Complete** → transaction status becomes `completed`
7. Either side can now **Leave a Review** on the other
8. Check `/notifications` — you'll see the whole trail (request received, accepted, completed)
9. Log in as `admin@cuk.ac.in` → `/admin` for stats, `/admin/reports` for moderation, `/admin/events` to post a campus event

## Automated Tests

```bash
npm test
```

Runs 16 integration tests against a real in-memory SQLite database and the actual HTTP routes (registration, email-domain validation, OTP verification, login, listing CRUD, search, wishlist, the full transaction lifecycle, reviews, and admin authorization).

---

## 13. API Overview

All endpoints are under `/api`. A handful of representative routes:

```
POST   /api/auth/register            Create account (requires @<UNIVERSITY_EMAIL_DOMAIN>)
POST   /api/auth/verify              Submit OTP to verify email
POST   /api/auth/login / logout
GET    /api/auth/me                  Current session user

GET    /api/listings                 Search + filter + sort + paginate
POST   /api/listings                 Create (multipart, up to 6 images)
PUT    /api/listings/:id             Update (owner or admin only)
DELETE /api/listings/:id

POST   /api/wishlist/:listingId | DELETE /api/wishlist/:listingId

POST   /api/conversations            Start/find a chat thread for a listing
GET    /api/conversations/:id/messages  |  POST .../messages

POST   /api/transactions             Request to buy/rent/exchange
PUT    /api/transactions/:id         action: accept | reject | cancel | confirm

POST   /api/reviews                  One per user per completed transaction

GET    /api/events   |  POST/PUT/DELETE /api/events        (mutations: admin only)
GET    /api/errands  |  POST /api/errands  |  PUT /api/errands/:id

POST   /api/reports                  Report a listing
GET    /api/admin/stats | /users | /listings | /reports    (admin only)
```

Full route definitions live in `routes/*.js` — each file maps 1:1 to a feature area.

---

## 14. Intentional Simplifications (documented, not hidden)

This is an MVP built for a college demo, so a few things are deliberately simplified rather than half-built:

- **Payments are not processed.** Buy/rent/exchange requests track *agreement* between two users; actual payment is arranged directly between them (cash/UPI), with an on-screen disclaimer. No payment gateway is integrated.
- **Chat uses polling, not WebSockets.** The message view re-fetches on open and on an interval — real-time push was judged unnecessary complexity for the assignment's scope.
- **OTP verification is simulated in Demo Mode.** No SMTP/email server is wired up; the code is generated server-side and returned in the API response so the flow can be demonstrated without external services. Swapping in a real mail provider means adding one function in `utils/helpers.js`.
- **University email domain is a single configurable string**, not a live directory lookup — appropriate for a single-campus deployment.
- **Session store uses the same SQL database** as the rest of the app (via `connect-session-sequelize`) rather than a separate Redis instance, to keep the deployment to one moving part.

---

## 15. Future Enhancements (roadmap, not implemented)

The architecture (REST API + thin views) is intentionally easy to extend:

- AI-assisted price suggestions
- Scheduled pickup/delivery windows
- A sustainability/impact tracker (items reused instead of bought new)
- Loyalty rewards for frequent traders
- Real university ID card integration for verification
- Escrow-based secure payments

---

## 16. Security Notes

- Passwords hashed with bcrypt, never stored or returned in plaintext
- Sessions are httpOnly cookies, backed by server-side storage (not JWT-in-localStorage)
- Every mutating route checks ownership/role server-side — the frontend hiding a button is never the only protection
- File uploads are validated by extension and size-capped (8MB default), stored with randomly generated filenames (never trusts the original filename)
- `express-async-errors` + a global error handler means unexpected exceptions return a generic message instead of a stack trace
- SQL is always parameterized via the Sequelize ORM — no raw string-concatenated queries

`npm audit` will show some known low/moderate advisories in transitive dependencies of the optional `sqlite3` native build tooling (used only for the local demo database). These do not affect the MySQL production path and are typical for local dev tooling; run `npm audit fix` if you'd like to address them.

---

## 17. Switching Between SQLite and MySQL

Because everything routes through Sequelize, switching is a one-line change in `.env` (`DB_DIALECT`). No application code needs to change. Run `npm run seed` again afterward to populate the new database.
