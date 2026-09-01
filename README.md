# job-tracker-api

Express + Mongoose REST API behind [job-tracker](https://github.com/petryga/job-tracker),
a Kanban board for tracking job applications, the roles on them, and the people
you talk to.

## Architecture

Authentication is **decoupled** from storage:

- **Identity** is issued by [Supabase Auth](https://supabase.com/auth). The client
  signs in against Supabase and sends the resulting access token as
  `Authorization: Bearer <jwt>`.
- **Data** lives in MongoDB. The API never sees a password. It verifies the JWT's
  signature against the project's published JWKS
  (`<SUPABASE_URL>/auth/v1/.well-known/jwks.json`, `jose`) and takes `payload.sub`
  — the Supabase user UUID — as the identity for the request.

Every document (`Board`, `Job`, `Contact`) carries a `createdBy` string equal to
that UUID. Every read and write is scoped to `createdBy: req.userId`, so one
user's token can never reach another user's data. There is no `User` collection.

```
client ──(Supabase JWT)──▶ requireAuth ──▶ controllers ──▶ MongoDB
                            verify sig            scope every query by createdBy
                            sub ▶ req.userId
```

## Auth middleware

`middleware/auth.js` runs before every `/api/*` route:

| Situation | Result |
| --- | --- |
| `SUPABASE_URL` set, valid token | `req.userId = payload.sub`, continue |
| `SUPABASE_URL` set, missing / bad / expired token | `401` |
| `SUPABASE_URL` unset, `AUTH_DISABLED=true` | `req.userId = AUTH_DISABLED_USER_ID ?? null`, continue |
| `SUPABASE_URL` unset, `AUTH_DISABLED` not `true` | `500` — fails closed, never serves anonymous traffic |

`/health` is the only unauthenticated route.

## Endpoints

All require a bearer token; all are scoped to the caller.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/health` | liveness probe (no auth) |
| `POST` | `/api/boards/create` | create a board |
| `GET` | `/api/boards/getAll` | the caller's boards |
| `GET` `PUT` `DELETE` | `/api/boards/:id` | one board (delete cascades to its jobs + contacts) |
| `POST` `PUT` `DELETE` | `/api/boards/lists/*` | columns on a board |
| `POST` `PUT` `DELETE` | `/api/boards/cards/*` | cards (jobs / contacts) on a list |
| `PUT` | `/api/boards/all/drag` | persist a drag-and-drop reorder |
| `GET` | `/api/jobs/getOne/:id` | one job card |
| `PUT` | `/api/jobs/:id` | update a job and its contacts |
| `GET` | `/api/contacts/getAll/:boardID` | contacts on a board |
| `GET` `DELETE` | `/api/contacts/getOne/:id`, `/api/contacts/delete/:id` | one contact |

## Running locally

```bash
npm install
cp .env.example .env      # fill in MONGODB_URI
npm run backend           # nodemon on PORT (default 3000)
```

With `AUTH_DISABLED=true` (the default in `.env.example`) the API runs without
Supabase — every request is treated as `AUTH_DISABLED_USER_ID`. To exercise real
auth, set `SUPABASE_URL` to the same project the frontend uses and leave
`AUTH_DISABLED` unset.

## Configuration

| Var | Required | Notes |
| --- | --- | --- |
| `MONGODB_URI` | yes | Mongo connection string |
| `SUPABASE_URL` | yes in prod | project URL; JWKS is derived from it |
| `AUTH_DISABLED` | no | `true` to run without Supabase (local, CI) |
| `AUTH_DISABLED_USER_ID` | no | `createdBy` value used while auth is disabled |
| `CORS_ORIGIN` | no | comma-separated allowlist; defaults to `http://localhost:3001`. In production, the deployed frontend's origin. |
| `PORT` | no | defaults to `3000` |

Deployed on Northflank; the frontend
([job-tracker](https://github.com/petryga/job-tracker)) is a static site on
Render, pointed here via its `VITE_BACKEND_URL`.

## Tests

```bash
npm test              # jest --runInBand
npm run test:coverage
npm run lint
```

Tests run against an in-memory MongoDB (`mongodb-memory-server`) and mock `jose`,
so the bearer token string is taken as the user id. No external services and no
`SUPABASE_URL` are needed. CI (`.github/workflows/ci.yml`) runs lint + tests on
every push and pull request.
