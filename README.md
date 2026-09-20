# SupportFlow

An AI-triaged customer support ticketing platform. Customers submit tickets in plain language, AI automatically categorizes and prioritizes them, and agents work from a live, sorted queue instead of a first-in-first-out inbox.

A live, isolated demo mode lets anyone try both the customer and agent experience with one click — no signup required — without ever touching real customer data.

**🔗 Live demo:** [supportflow-frontend-ikxu.onrender.com](https://supportflow-frontend-ikxu.onrender.com)
*(Hosted on Render's free tier — the backend may take 30–50s to wake up on the first request after inactivity.)*

---

## What it does

1. **A customer submits a ticket** — just a subject and description, no forms to fill out first.
2. **AI triages it instantly** — Google Gemini reads the ticket and attaches a category, a priority (Low/Medium/High), and a one-line summary before any agent opens it.
3. **An agent claims it from a live queue** — the most urgent tickets sit on top; nothing important waits behind something small.
4. **Customer and agent chat in real time** — messages sync instantly over WebSockets, with an AI auto-reply while the ticket is still unassigned.
5. **The ticket gets resolved** — the agent adds a resolution note; the customer can optionally book a dedicated session with an agent and leave a 1–5 star review once it's done.
6. **Agents see their own analytics** — ticket volume, resolution rate, average resolution time, and a per-agent leaderboard.

---

## Tech stack

**Frontend**
- React 19 + Vite
- React Router
- Tailwind CSS v4
- Axios
- Socket.IO client
- Framer Motion (animation)
- Recharts (analytics charts)
- Lucide React (icons)

**Backend**
- Node.js + Express 5
- MongoDB + Mongoose
- Socket.IO (real-time chat, live queue, notifications)
- JSON Web Tokens + bcrypt (auth)
- Google Gemini API (`@google/genai`) — AI ticket triage and auto-reply
- express-rate-limit (abuse protection on auth routes)

**Hosting**
- Render (Web Service for the backend, Static Site for the frontend)

---

## Project structure

```
supportflow/
├── backend/
│   ├── server.js                 # Express + HTTP server + Socket.IO bootstrap
│   └── src/
│       ├── config/db.js          # Mongoose connection
│       ├── controllers/          # Route handlers (auth, tickets, messages, bookings, analytics, notifications, reviews)
│       ├── middleware/           # JWT auth + role authorization, rate limiting
│       ├── models/                # Mongoose schemas (User, Ticket, Message, Booking, Notification, Review)
│       ├── routes/                # Express routers
│       ├── services/aiService.js # Gemini wrapper — triageTicket, generateReply
│       ├── sockets/index.js      # Socket.IO auth, rooms, real-time broadcasts
│       └── utils/                # Ticket number generator, demo account seeder
│
└── frontend/
    └── src/
        ├── api/axios.js          # Axios instance with auth interceptor
        ├── components/           # Navbar, NotificationBell, badges, auth layout, ui primitives
        ├── context/               # AuthContext, SocketContext
        └── pages/                 # Landing, Login, Register, dashboards, ticket detail, analytics
```

---

## Getting started

### Prerequisites
- Node.js 18+
- A MongoDB connection string (local or Atlas)
- A Google Gemini API key ([aistudio.google.com](https://aistudio.google.com))

### 1. Clone and install

```bash
git clone <your-repo-url>
cd supportflow

cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment variables

Create `backend/.env`:

```env
MONGO_URI=your-mongodb-connection-string
JWT_SECRET=a-long-random-string
GEMINI_API_KEY=your-gemini-api-key
PORT=5000

# Enables the one-click "Try as Customer / Try as Agent" demo login.
# Leave unset (or false) in any deployment that will hold real customer data.
DEMO_LOGIN_ENABLED=true

# Required in production for CORS to work correctly with credentials.
FRONTEND_URL=http://localhost:5173
```

Create `frontend/.env` (for local dev only — on Render these are set as environment variables in the dashboard instead):

```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

### 3. Seed the demo accounts (optional, needed for demo login)

```bash
cd backend
node src/utils/seedDemoUsers.js
```

Creates two fixed accounts (`demo.customer@supportflow.dev` / `demo.agent@supportflow.dev`), both flagged `isDemo: true` so their tickets and analytics never mix with real data.

### 4. Run it

```bash
# terminal 1
cd backend && npm run dev

# terminal 2
cd frontend && npm run dev
```

Frontend runs on `http://localhost:5173`, backend on `http://localhost:5000`.

---

## Demo mode & data isolation

Every user (and every ticket, created from it) carries an `isDemo` flag. This keeps two completely separate worlds:

- **Demo world** — anyone who logs in via "Try as Customer" / "Try as Agent" only ever sees, books, or gets analytics on other demo data.
- **Real world** — anyone who registers with a real email/password only ever sees real data. Demo tickets, demo agents, and demo analytics are invisible to them, and vice versa.

This boundary is enforced server-side (ticket queries, booking/agent-suggestion queries, analytics aggregation, and even the Socket.IO rooms agents join for live updates) — not just hidden in the UI.

---

## Deployment (Render)

The app is deployed as two separate Render services from the same GitHub repo:

| Service | Type | Root directory | Build command | Start command |
|---|---|---|---|---|
| `supportflow-backend` | Web Service (Node) | `backend` | `npm install` | `node server.js` |
| `supportflow-frontend` | Static Site | `frontend` | `npm install; npm run build` | — (publish directory: `dist`) |

**Backend environment variables** (Render dashboard → service → Environment):
`MONGO_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, `DEMO_LOGIN_ENABLED`, and `FRONTEND_URL` (must exactly match the deployed frontend's URL, or CORS will silently reject authenticated requests).

**Frontend environment variables**:
`VITE_API_URL` and `VITE_SOCKET_URL`, both set to the backend's Render URL (no `/api` suffix — the app already appends `/api` itself). Vite bakes these in at build time, so changing them requires a manual redeploy, not just a save.

**Static Site rewrite rule** (required for client-side routing — without it, refreshing on any route other than `/` returns a 404):
Source `/*` → Destination `/index.html` → Action `Rewrite`.

**MongoDB Atlas users**: whitelist `0.0.0.0/0` in Network Access, or Render's outbound requests will be refused.

**Free tier note**: Render's free web services spin down after inactivity — the first request after a while can take 30–50s, and an idle Socket.IO connection may drop and need to reconnect.

---

## Known limitations

- AI triage and auto-reply depend on Gemini API availability — if the call fails for any reason, the app degrades gracefully (a ticket is still created, agents can categorize manually).
- No password-reset email flow yet.
- No file/image attachments on tickets or messages.

---

## License

Private project — not currently licensed for reuse.
