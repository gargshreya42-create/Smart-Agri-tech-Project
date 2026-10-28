# Smart Agri-Tech

A full-stack **MERN** smart-farming platform. Farmers manage farms, crops and soil health, check weather and pest alerts, buy resources, consult experts and talk to other farmers. Administrators manage users, catalogue, orders, alerts, experts and community moderation from a separate console.

> Built with **JavaScript only**: React, Bootstrap, Axios · Node.js, Express · MongoDB (Mongoose) · JWT + bcrypt · Postman.

---

## Features

**Farmer**
- Register / log in (email *or* phone), role-aware redirects, secure logout (revokes the token)
- Dashboard: farms, active crops, soil status, live weather, pest alerts, pending orders, alerts feed, recent activity
- Farms and crops: full CRUD, crop growth progress, crop detail page with soil, pests and weather advice
- Soil health: record pH, N, P, K, moisture, organic matter → scored status (Excellent → Critical), charts and plain-language recommendations (guidance, not a lab diagnosis)
- Weather: current conditions, 7-day forecast, admin advisories; cached per location with a graceful offline fallback
- Pest alerts: filter by risk and "for my crops"
- Resource marketplace: search, category, stock filters, cart, checkout (no payment gateway), order history and a visual tracking timeline, cancel while Pending / Confirmed
- Experts: directory, consultation requests, history, cancel
- Community: posts, categories, search, popular / recent, comments with replies, likes
- Profile, password change (signs out other devices), language switcher (English / हिन्दी / मराठी)

**Admin** (`/admin/*`)
- Dashboard with statistics, charts, recent orders and activity
- Users (create incl. admins, edit, activate / deactivate), farms, crops, resources (stock and availability), orders (status workflow), weather advisories + cached forecasts, pest alerts, experts + consultation responses, community moderation (hide / restore / delete), reports

**Platform**: responsive Bootstrap UI, lazy-loaded routes, centralized translations, toasts, skeleton / empty / error states, accessible forms and colour-independent status badges, centralized error handling, request validation, logging, rate-limited auth.

---

## Architecture

```text
React (Vite) ─► Axios (JWT header) ─► Express REST API ─► Middleware ─► Controllers ─► Services ─► MongoDB
                                         │  auth (JWT) → role check (farmer / admin) → validation
```

```text
agri-tech/
├── package.json            # root scripts (install:all, dev, seed, build)
├── postman/                # Postman collection (≈120 requests)
├── server/
│   ├── config/             # env loading, MongoDB connection
│   ├── controllers/        # one per module
│   ├── middleware/         # auth (protect / authorize), error handling
│   ├── models/             # Mongoose schemas + indexes
│   ├── routes/             # route files + request schemas
│   ├── services/           # weather, soil scoring, activity log
│   ├── utils/              # validation, logger, rate limit, seed script
│   ├── app.js  server.js
│   └── .env.example
└── client/
    ├── index.html  vite.config.js
    └── src/
        ├── components/     # reusable UI (forms, modals, charts, tables, badges…)
        ├── context/        # auth, language, cart, toast
        ├── hooks/          # useFetch, useDebounce, useMeta
        ├── layouts/        # public + dashboard (sidebar) layouts
        ├── pages/          # farmer pages  (+ pages/admin/*)
        ├── services/api.js # Axios instance + error helpers
        ├── translations/   # en, hi, mr
        └── styles/theme.css
```

---

## Prerequisites

- **Node.js 18+** (`node -v`)
- **MongoDB** — either local Community Server (`mongodb://127.0.0.1:27017`) or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

---

## Setup & run

```bash
# 1. install everything (root + server + client)
npm install
npm run install:all

# 2. configure the server
cp server/.env.example server/.env
#    edit server/.env  →  set MONGODB_URI and a long random JWT_SECRET:
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# 3. load realistic demo data  (WARNING: first empties every app collection in that database)
npm run seed

# 4. start API (http://localhost:5000) and client (http://localhost:5173) together
npm run dev
```

Or run them separately: `npm run server` and `npm run client`. Open **http://localhost:5173**.

### Environment variables (`server/.env`)

| Variable | Purpose |
|---|---|
| `PORT` | API port (default 5000) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for signing tokens — **required**, keep private |
| `JWT_EXPIRES_IN` | Token lifetime (default `7d`) |
| `WEATHER_API_KEY` | Optional OpenWeatherMap key. Empty → free Open-Meteo (no key). The key is only ever read by the server |
| `CLIENT_URL` | Allowed browser origin(s) for CORS, comma separated |

Client (`client/.env`, optional): `VITE_API_URL` — only when the API is deployed on a different origin. In development Vite proxies `/api` to `localhost:5000`.

### MongoDB setup

- **Local**: install MongoDB Community Server, start `mongod`, keep `MONGODB_URI=mongodb://127.0.0.1:27017/agri_tech`.
- **Atlas**: create a free cluster, add a database user, allow your IP, copy the `mongodb+srv://…` string into `MONGODB_URI`.
- **Docker**: `docker run -d -p 27017:27017 --name agri-mongo mongo:7`

---

## Demo credentials (after `npm run seed`)

| Role | Email | Password |
|---|---|---|
| Admin | `admin@smartagritech.in` | `Admin@123` |
| Farmer (richest data) | `ramesh.verma@example.com` | `Farmer@123` |
| Other farmers | `sunita.patel@example.com`, `mahesh.jadhav@example.com`, … | `Farmer@123` |

Change these before any real deployment.

---

## Authentication & roles

- Passwords are hashed with **bcrypt**; plain text is never stored or logged.
- Login returns a signed **JWT** (`Authorization: Bearer <token>`). Logout, password change, deactivation and role change bump a per-user token version, instantly invalidating older tokens.
- `protect` middleware verifies the token and loads the user; `authorize('admin' | 'farmer')` enforces roles. React routes are guarded too, but the API is the real gate.
- **Admin accounts cannot be self-registered** (public registration is farmer-only); admins create other admins from *Admin → Users*.
- Farmers only ever see their own farms, crops, soil records, orders and consultations.

## API overview

Base URL `http://localhost:5000/api` · all responses use `{ success, message, data, meta? }` (errors: `{ success: false, message, error }`).

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` |
| Users | `GET/PUT /users/profile`, `PUT /users/password`, `GET /users/dashboard`, `GET /users/activity` |
| Farms | `GET/POST /farms`, `GET/PUT/DELETE /farms/:id` |
| Crops | `GET/POST /crops`, `GET/PUT/DELETE /crops/:id` |
| Soil | `GET/POST /soil`, `DELETE /soil/:id` |
| Weather | `GET /weather?location=`, `GET/POST /weather/alerts`, `PUT/DELETE /weather/alerts/:id`, `GET /weather/records` (admin) |
| Pests | `GET /pests` (`risk`, `crop`, `mine`, `q`), admin `POST/PUT/DELETE` |
| Resources | `GET /resources` (`q`, `category`, `availability`, `sort`), admin `POST/PUT/DELETE` |
| Orders | `GET/POST /orders`, `GET /orders/:id`, `PATCH /orders/:id/cancel`, admin `PATCH /orders/:id/status` |
| Experts | `GET /experts`, admin `POST/PUT/DELETE` |
| Consultations | `GET/POST /consultations`, `PATCH /consultations/:id/status` |
| Community | `GET/POST /community/posts`, `GET/PUT/DELETE /community/posts/:id`, `POST …/like`, `POST …/comments`, `DELETE …/comments/:commentId`, admin `PATCH …/moderate` |
| Admin | `GET /admin/stats`, `GET /admin/reports`, `GET/POST /admin/users`, `PUT /admin/users/:id` |
| Utility | `GET /health`, `GET /meta` (reference lists used by forms) |

Lists accept `page` and `limit` and return pagination in `meta`.

## Testing with Postman

1. Import `postman/SmartAgriTech.postman_collection.json`.
2. Make sure the API is running and the database is seeded.
3. Run the collection top to bottom (Collection Runner). Folder 1 logs in and stores `token` / `adminToken` variables automatically; the folders then cover CRUD for farms, crops, soil, weather, pests, resources, orders, experts, community and admin, **plus negative cases**: validation (422), invalid IDs (400), missing / bad tokens (401), wrong role (403), conflicts (409), unknown routes (404) and malformed JSON.
4. Folder 14 cleans up the records the run created.

## Security notes

Helmet headers, strict CORS allow-list, 100 kB body limit, auth rate limiting, input validation on every write, regex-escaped search input, ownership checks on every farmer resource, no stack traces or secrets in responses, no secrets in the client bundle (weather keys stay on the server).

## Photos & credits

Every screen uses real agricultural photographs chosen by content: crop cards show that crop, pest cards show the pest or the affected crop, soil and weather pages follow the reading, and so on. All mappings live in `client/src/utils/images.js`.

- Photos are hotlinked from Wikimedia Commons (open licences). Authors and licences are listed on the in-app `/credits` page.
- Run `cd client && npm run check:images` to confirm every photo still loads (`--list` prints the catalogue).
- If a photo fails to load, a clean "photo unavailable" panel appears instead of a broken icon.
- Farms, pest alerts and resources accept an optional `imageUrl` (http/https) to override the default photo.
- Expert and user avatars are initials-based by design, so no real person's portrait is attached to an account.
- If you add a Content-Security-Policy, allow `img-src https://commons.wikimedia.org https://upload.wikimedia.org`.
- A few items (e.g. girdle beetle, onion thrips, pheromone traps) use the affected-crop or a category photo because no exact photo was available.

## Troubleshooting

- **`Missing required environment variable`** — create `server/.env` from `.env.example` and set `JWT_SECRET`.
- **`Could not connect to MongoDB`** — start `mongod` / check `MONGODB_URI` and Atlas IP allow-list.
- **CORS error in the browser** — add the page origin to `CLIENT_URL`.
- **Weather shows a fallback** — the external service was unreachable; the last cached forecast is shown.

## Ideas for future enhancement

Payment gateway (Razorpay), image upload for crops and resources, mandi price feeds, SMS / WhatsApp alerts, crop-disease detection from photos, PWA offline mode, more languages, unit and end-to-end tests in CI.
