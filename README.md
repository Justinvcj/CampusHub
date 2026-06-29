# CampusHub

CampusHub is a full-stack college management platform that brings events, clubs, lost and found, notifications, and campus administration into one role-aware workspace.

## Features

- Student, faculty, and admin dashboards with live statistics and Chart.js reporting
- JWT access tokens, rotating refresh sessions in secure HTTP-only cookies, password reset, bcrypt hashing, and role-based access control
- Events with discovery, filters, registration capacity, cancellation, participants, attendance QR codes, and management
- Clubs with membership, announcements, posts, comments, likes, and faculty management
- Lost and found reporting, image upload, claims, admin review, closing, and archiving
- Global debounced search, server-side pagination, notifications, uploads, audit logs, responsive states, and accessible navigation
- Helmet, CORS, rate limiting, request validation, parameterized SQL, centralized errors, and request logging

## Architecture

The React 19 client uses route-level screens, reusable components, an authentication context, and an Axios service with refresh handling. The Express server follows MVC boundaries: routes validate and authorize requests, controllers coordinate behavior, services own cross-cutting notifications/auditing, and MySQL access is isolated in `config/db.js`.

```text
client/src/
  components  context  hooks  layouts  pages  services  utils  assets
server/
  config  controllers  database  middlewares  models  routes  services  uploads  utils
```

## Tech Stack

React 19, Vite, Tailwind CSS 4, React Router, Axios, Chart.js, Node.js, Express, MySQL, JWT, bcrypt, Multer, Vitest, and Supertest.

## Local Setup

Requirements: Node.js 20+ and MySQL 8+.

```bash
git clone https://github.com/Justinvcj/CampusHub.git
cd CampusHub
npm install
npm install --prefix client
cp .env.example .env
```

Create the schema, then seed it:

```bash
mysql -u root -p < server/database/schema.sql
npm run db:seed
```

Start the API and client in separate terminals:

```bash
npm run server
npm run dev --prefix client
```

Open `http://localhost:5173`. Seed accounts use password `Campus@123`; examples are `admin@campushub.edu`, `student1@campushub.edu`, and `faculty1@campushub.edu`.

## Environment

Copy `.env.example` to `.env`. Set MySQL credentials, `CLIENT_URL`, two independent long JWT secrets, token lifetimes, and optional SMTP values. In production, terminate HTTPS at the proxy so secure refresh cookies remain protected.

## API

All endpoints are under `/api`. Major groups:

- `/auth`: register, login, logout, refresh, forgot/reset password, current user
- `/events`: browse, create, update, remove, register, cancel, participants, attendance QR
- `/clubs`: browse, manage, join/leave, members, announcements, feed posts
- `/lost-items`: browse, report, claim, review, close/archive
- `/dashboard/:role`, `/notifications`, `/search`, `/users`, `/posts`

Responses use `{ success, data }`; failures use `{ success: false, message, errors? }`.

## Scripts

- `npm run dev` starts both applications (requires `concurrently`)
- `npm run server` runs the API with Nodemon
- `npm run build` creates the production client
- `npm test` runs API tests
- `npm run db:seed` creates deterministic development data

## Production Notes

Use a managed MySQL database, persistent object storage instead of the local upload folder, HTTPS, a transactional email provider, secret management, and a reverse proxy. Run the client build behind a CDN and the API as a separate service.

## Screenshots

Add current screenshots to `docs/screenshots/` after deploying the target environment.

## Future Enhancements

Native push notifications, calendar synchronization, offline event tickets, SSO, advanced attendance hardware integration, and institution-level multi-tenancy are natural next steps.
