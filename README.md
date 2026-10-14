# COMP 3123 – Assignment 1: Secure Employee Management API

A RESTful backend built with **Node.js, Express and MongoDB (Mongoose)**. Users sign up, log in to receive a **JWT**, and manage **only the employees they created**.

- **Database name:** `comp3123_assignment1`
- **Deployed API:** `https://101584721-comp-3123-assignment1.vercel.app/`
- **Postman collection:** `postman/COMP3123_Assignment1.postman_collection.json`

## Technologies

Node.js, Express 4, MongoDB, Mongoose 8, bcryptjs, jsonwebtoken, helmet, express-rate-limit, express-validator, winston, dotenv.

## Project structure

```
api/index.js              Vercel serverless entry point
src/
  server.js               Local entry (connects DB, starts server)
  app.js                  Express app: helmet, logging, routes, error handling, /health
  config/                 env.js (validated env vars), db.js (cached Mongo connection)
  models/                 User.js, Employee.js
  routes/                 userRoutes.js, empRoutes.js
  controllers/            userController.js, empController.js
  middleware/             auth, validate, rateLimiters, requestLogger, errorHandler
  validators/             express-validator rule sets
  utils/                  logger, AppError, asyncHandler
logs/                     app.log / error.log (generated), sample-app-log.txt
postman/                  Exported Postman collection
```

## Installation

1. Clone: `git clone https://github.com/Eneiyavan/101584721_COMP3123_Assignment1.git`
2. Install: `npm install`
3. Configure: copy `.env.example` to `.env` and set values (see below).
4. Start MongoDB locally (e.g. `mongod`) or use a MongoDB Atlas URI in `MONGODB_URI`.
5. Run: `npm start` (or `npm run dev` for auto-reload). Server listens on `http://localhost:3000`.
6. Test: import the Postman collection and run the folders in order (0 → 6).

## Configuration (environment variables)

| Variable | Purpose | Example |
| --- | --- | --- |
| `PORT` | Server port | `3000` |
| `MONGODB_URI` | Mongo connection string | `mongodb://127.0.0.1:27017/comp3123_assignment1` |
| `JWT_SECRET` | Secret used to sign JWTs (long random string) | _(never commit)_ |
| `JWT_EXPIRES_IN` | Token lifetime | `1h` |
| `AUTH_RATE_LIMIT_WINDOW_MIN` / `AUTH_RATE_LIMIT_MAX` | Auth limiter window (min) / max requests | `15` / `20` |
| `API_RATE_LIMIT_WINDOW_MIN` / `API_RATE_LIMIT_MAX` | General API limiter | `15` / `100` |

The app refuses to start if `MONGODB_URI` or `JWT_SECRET` is missing. `.env` is git-ignored; `.env.example` contains placeholders only.

## API endpoints

Success responses are JSON: `{ "status": "success", ... }`. Errors are JSON: `{ "status": "error", "message": "...", "errors": [{ "field", "message" }] }`.

| # | Method | Endpoint | Auth | Success |
| - | ------ | -------- | ---- | ------- |
| 1 | POST | `/api/v1/user/signup` | No | 201 |
| 2 | POST | `/api/v1/user/login` | No | 200 (returns `token`) |
| 3 | GET | `/api/v1/emp/employees` | JWT | 200 |
| 4 | POST | `/api/v1/emp/employees` | JWT | 201 |
| 5 | GET | `/api/v1/emp/employees/{eid}` | JWT | 200 |
| 6 | PUT | `/api/v1/emp/employees/{eid}` | JWT | 200 |
| 7 | DELETE | `/api/v1/emp/employees?eid=xxx` | JWT | 204 |
| – | GET | `/health` | No | 200 |

**Signup body:** `{ "username": "alice", "email": "alice@test.com", "password": "Passw0rdA" }`
(password: 8–72 chars with upper-case, lower-case and a number).

**Login body:** `{ "username": "alice", "password": "..." }` **or** `{ "email": "alice@test.com", "password": "..." }`.

**Employee body:** `first_name, last_name, email, position, salary (> 0), date_of_joining (ISO date), department`. `PUT` accepts any subset (at least one field).

### Status codes used

| Code | When |
| --- | --- |
| 200 / 201 / 204 | Successful read/update/login, create, delete |
| 400 | Validation failure, malformed JSON, invalid ObjectId |
| 401 | Missing/invalid/expired JWT, invalid credentials |
| 403 | Employee exists but belongs to another user |
| 404 | Employee or route does not exist |
| 409 | Duplicate username/email (or duplicate employee email for the same owner) |
| 429 | Rate limit exceeded |
| 500 | Unexpected server error (generic message, no internals leaked) |

## Authentication

1. **Signup** creates the user; the password is hashed with bcrypt (12 rounds) before saving.
2. **Login** (username or email + password) verifies the hash and returns a signed JWT (`{ id }`, expires per `JWT_EXPIRES_IN`). Wrong username and wrong password produce the same `401` message to prevent user enumeration.
3. Send the token on every employee request: `Authorization: Bearer <jwt>`.
4. The `auth` middleware verifies the signature and expiry, loads the user from the database, and sets `req.user`. Missing, invalid, or expired tokens return `401`.

## Authorization (users only see their own employees)

- Each employee stores `user` (ObjectId → `User`), set **server-side** from `req.user` at creation. A `user` value in the request body is ignored.
- `GET /employees` queries `Employee.find({ user: req.user._id })`, so other users' employees never appear.
- For `GET/PUT/DELETE` by id, the employee is loaded and its owner compared to `req.user`: unknown id → `404`, someone else's employee → `403`. The update/delete queries also include `user: req.user._id`, so ownership is enforced in the database query as well; changing `eid` cannot bypass it.

## Security

- **Password hashing:** bcrypt; `password` is `select: false` and stripped from JSON output.
- **JWT:** signed with `JWT_SECRET`, expiring, verified on each protected request.
- **Helmet:** sets security headers (e.g. `X-Content-Type-Options`, `Strict-Transport-Security`, `X-Frame-Options`, CSP) to mitigate sniffing, clickjacking and XSS-type attacks; `X-Powered-By` is disabled.
- **Rate limiting:** `express-rate-limit`. `POST /api/v1/user/signup` and `/login` allow `AUTH_RATE_LIMIT_MAX` requests (default 20) per window (default 15 min) per IP, to slow brute-force attacks. All `/api` routes also share a general limiter (default 100 / 15 min). When exceeded the API returns **429** with JSON `{"status":"error","message":"Too many requests. Please try again later."}` and `RateLimit-*` headers. Restarting the server resets counters (in-memory store).
- **Input validation:** express-validator on all inputs (required fields, types, lengths, email format, positive numeric salary, ISO dates, valid ObjectIds). Non-string values are rejected, and Mongoose `sanitizeFilter` blocks `$`-operator injection. Body size is limited to 10 KB.
- **Environment variables:** secrets are read from `.env`/the host environment and never committed.
- **Error handling:** one central handler returns consistent JSON and hides stack traces and internals for 5xx errors.

## Logging

Logs are written with winston to the console and, locally, to `logs/app.log` (everything) and `logs/error.log` (errors). Each request is logged with timestamp, method, path, status, duration and IP. Application events are logged too: server start, DB connection, signup, login success/failure, validation failures, missing/invalid/expired token, authorization (403) failures, rate-limit hits, CRUD operations, and errors.

**Never logged:** passwords, password hashes, JWTs, the JWT secret, DB credentials, request bodies, or query strings. `*.log` files are git-ignored, so `logs/sample-app-log.txt` is a sample. (On Vercel the filesystem is read-only, so logs go to the console / Vercel logs only.)

## Health check

`GET /health` → `200`

```json
{ "status": "ok", "service": "comp3123-assignment1", "uptimeSeconds": 42, "timestamp": "2026-10-12T04:00:00.000Z", "database": "connected" }
```

## Deploying to Vercel

1. Create a free MongoDB Atlas cluster, create a database user, and allow network access from `0.0.0.0/0`. Use a URI ending in `/comp3123_assignment1`.
2. Push the repo to GitHub and import it in Vercel (framework preset: **Other**).
3. Add environment variables `MONGODB_URI`, `JWT_SECRET` (and optionally `JWT_EXPIRES_IN`) in Project Settings → Environment Variables, then deploy.
4. `vercel.json` rewrites all paths to `api/index.js`, which exports the Express app. Test `https://<project>.vercel.app/health`.
