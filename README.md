# 🏦 NeoBanking — Modern Digital Banking Platform

A full-stack digital banking simulation built to showcase real-world fintech architecture: instant e-transfers, real-time notifications via Socket.IO, financial goal tracking, and a clean dark-mode UI.

---

## ✨ Features

| Feature | Details |
|---|---|
| **Auth** | JWT-based login/register with bcrypt password hashing |
| **Accounts** | Auto-created on signup with $1,000 CAD simulated balance |
| **E-Transfers** | Instant deposit if recipient exists; pending invite if not |
| **Real-time** | Socket.IO — sender/receiver see updates under 1 second |
| **Goals** | Create savings goals, add funds, track progress with visual bars |
| **Notifications** | In-app notification panel with unread count badge |
| **Analytics** | 6-month spending chart (sent vs. received) |
| **Responsive** | Mobile-first design, works on all screen sizes |
| **Dark mode** | Permanent dark theme with purple/blue gradient accents |

---

## 🧱 Tech Stack

### Backend
- **Node.js + Express** — HTTP server
- **Apollo Server 4** — GraphQL API (`/graphql`)
- **MongoDB + Mongoose** — Database and ORM
- **Socket.IO** — Real-time bidirectional events
- **JWT + bcrypt** — Authentication and password security
- **Nodemailer** — Email notifications (dev: console log, prod: SMTP/SendGrid)

### Frontend
- **React 18 + Vite** — Fast development and build
- **Tailwind CSS** — Utility-first styling with dark mode
- **Apollo Client** — GraphQL queries and mutations
- **Zustand** — Lightweight auth state management
- **Socket.IO Client** — Real-time event listener
- **Recharts** — Spending analytics chart
- **React Hot Toast** — Toast notifications
- **Lucide React** — Icon library

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm

### 1. Clone / unzip the project

```bash
cd neobanking
```

### 2. Run the setup wizard

```bash
# macOS/Linux
node setup.js

# Windows
setup.bat
```

The wizard will:
- Copy `.env.example` → `.env` for both backend and frontend
- Auto-generate a secure JWT secret
- Install all npm dependencies

### 3. Start MongoDB (if running locally)

```bash
mongod
```

Or update `MONGODB_URI` in `backend/.env` with your Atlas connection string.

### 4. Start the servers

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

### 5. Open the app

```
http://localhost:5173
```

> New accounts are automatically created with **$1,000 CAD** for testing transfers.

---

## 📁 Project Structure

```
neobanking/
├── backend/
│   ├── src/
│   │   ├── config/db.js           # MongoDB connection
│   │   ├── middleware/auth.js     # JWT verification
│   │   ├── models/                # Mongoose schemas
│   │   │   ├── User.js
│   │   │   ├── Account.js
│   │   │   ├── Transaction.js
│   │   │   ├── Goal.js
│   │   │   └── Notification.js
│   │   ├── resolvers/index.js     # All GraphQL resolvers
│   │   ├── schema/typeDefs.js     # GraphQL type definitions
│   │   ├── services/
│   │   │   ├── emailService.js    # Nodemailer / SendGrid
│   │   │   └── socketService.js  # Socket.IO handler
│   │   └── server.js             # Express + Apollo + Socket.IO
│   └── .env.example
├── frontend/
│   └── src/
│       ├── components/            # Reusable UI components
│       ├── graphql/               # GQL queries & mutations
│       ├── lib/                   # Apollo client, Socket, utils
│       ├── pages/                 # Route-level pages
│       ├── store/                 # Zustand auth store
│       └── App.jsx
├── setup.js                       # Cross-platform setup wizard
└── README.md
```

---

## 📡 GraphQL API

### Queries

| Query | Description |
|---|---|
| `getMe` | Authenticated user + accounts + goals |
| `getAccounts` | User's bank accounts |
| `getTransactions` | Paginated transaction history |
| `getGoals` | All savings goals |
| `getNotifications` | Recent notifications |
| `getSpendingAnalytics` | Monthly sent/received aggregation |

### Mutations

| Mutation | Description |
|---|---|
| `registerUser` | Sign up + auto-create account |
| `loginUser` | Sign in → JWT |
| `sendTransfer` | E-transfer to email |
| `createGoal` | New savings goal |
| `addToGoal` | Contribute to a goal |
| `deleteGoal` | Remove a goal |
| `markNotificationRead` | Mark one notification read |
| `markAllNotificationsRead` | Mark all read |
| `updateProfile` | Update name/avatar |

---

## ⚡ Real-time Events (Socket.IO)

| Event (server → client) | Payload |
|---|---|
| `transfer_sent` | `{ transaction, newBalance, notification }` |
| `transfer_received` | `{ transaction, newBalance, senderName, amount }` |
| `transfer_pending` | `{ transaction, newBalance, notification }` |
| `goal_updated` | `{ goal, newBalance, notification }` |

The frontend authenticates by emitting `authenticate` with the JWT token after connecting.  
The server joins the socket to a room named after the `userId`, so events are private.

---

## 💸 E-Transfer Flow

```
User A sends $X to email@example.com
    │
    ├─► Email exists in DB?
    │       YES → deduct A's balance → credit B's balance
    │             → emit transfer_sent to A
    │             → emit transfer_received to B
    │             → send email notification
    │
    └─► Email NOT in DB?
            → deduct A's balance → create PENDING transaction
            → emit transfer_pending to A
            → send invite email to recipient
            → on B's registration → auto-credit pending balance
```

---

## 🔐 Environment Variables

### `backend/.env`

| Variable | Description |
|---|---|
| `PORT` | Server port (default 4000) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for signing JWTs (auto-generated) |
| `CLIENT_URL` | Frontend origin for CORS |
| `SMTP_HOST/PORT/USER/PASS` | SMTP email config (optional) |
| `SENDGRID_API_KEY` | SendGrid API key (optional) |
| `FROM_EMAIL` | Sender address for emails |

### `frontend/.env`

| Variable | Description |
|---|---|
| `VITE_GRAPHQL_URL` | GraphQL endpoint |
| `VITE_BACKEND_URL` | Backend base URL (for Socket.IO) |

---

## 🚢 Deployment

### Frontend → Vercel

```bash
cd frontend
npm run build
# Deploy dist/ to Vercel or drag-and-drop in Vercel dashboard
# Set VITE_GRAPHQL_URL and VITE_BACKEND_URL in Vercel env vars
```

### Backend → Render / Railway

1. Push to GitHub
2. Create new Web Service on Render or Railway
3. Set **Build command**: `npm install`
4. Set **Start command**: `npm start`
5. Add all `backend/.env` variables in the platform's env settings
6. Set `CLIENT_URL` to your Vercel frontend URL

### Database → MongoDB Atlas

1. Create a free cluster at [atlas.mongodb.com](https://atlas.mongodb.com)
2. Whitelist your backend server IP
3. Copy the connection string into `MONGODB_URI`

---

## 🔒 Security Notes

- Passwords are hashed with **bcrypt** (12 rounds)
- JWTs expire in **7 days**
- Input validation on all mutations (amount > 0, self-transfer check, insufficient balance)
- CORS restricted to `CLIENT_URL`
- Auth errors return generic messages to prevent enumeration

---

## 📄 License

MIT — build and ship freely.
