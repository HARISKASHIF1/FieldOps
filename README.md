# ⚡ FieldOps — Field Service Management Platform

## 🚀 Quick Start with XAMPP

### Prerequisites
- Node.js 18+
- XAMPP installed (for MySQL) → https://www.apachefriends.org

---

### Step 1 — Start XAMPP
1. Open **XAMPP Control Panel**
2. Click **Start** next to **MySQL**
3. (Apache is not needed)

---

### Step 2 — Create the database
1. Open browser → go to **http://localhost/phpmyadmin**
2. Click **New** (left sidebar)
3. Type database name: `fieldops`
4. Click **Create**

---

### Step 3 — Install dependencies
```bash
cd backend  && npm install
cd ../frontend && npm install
```

---

### Step 4 — Run migrations + seed
```bash
cd backend
npm run migrate
npm run seed
```

---

### Step 5 — Start servers (2 terminals)
```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

---

### Step 6 — Open the app
👉 **http://localhost:3000**

---

## 🔑 Test Credentials

| Role       | Email                 | Password   |
|------------|-----------------------|------------|
| Admin      | admin@fieldops.com    | admin123   |
| Technician | alice@fieldops.com    | tech123    |
| Technician | bob@fieldops.com      | tech123    |
| Client     | acme@client.com       | client123  |
| Client     | globex@client.com     | client123  |

---

## ⚙️ Environment Variables (backend/.env)
```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=fieldops
DB_USER=root
DB_PASSWORD=        ← leave empty for XAMPP default
```

---

## 📁 Structure
```
fieldops/
├── backend/   → Node.js + Express + TypeScript + MySQL
├── frontend/  → React + Vite + TypeScript + Tailwind
├── docs/      → Architecture document
└── README.md
```

## ✅ Assumptions
1. Admin creates all jobs — clients request via phone/email
2. Open registration for all roles (for easy testing)
3. Technicians can only update status of their own jobs
4. In-app notifications only (no email required)
5. Soft deletes on jobs — data never permanently lost

## ⚖️ Trade-offs
| Decision | Why |
|---|---|
| XAMPP MySQL over PostgreSQL | Zero external install — works out of the box |
| Raw mysql2 queries | Full control, no ORM magic |
| In-app notifications | No SMTP/email setup needed |

## ❌ What's Missing
- Email notifications
- File attachments
- Frontend pagination
- Unit/integration tests
- Docker setup
- Password reset flow
