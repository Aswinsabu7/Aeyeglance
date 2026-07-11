# Ticket Management System

A production-ready full-stack Ticket Management System built with **Angular 20** (frontend) and **Node.js + Express** (backend). Data is persisted in JSON files — no database required.

---

## Project Structure

```
root/
├── client/     Angular 20 SPA
└── server/     Node.js + Express REST API
```

---

## Quick Start

### 1. Backend

```bash
cd server
npm install
# Review / edit .env as needed
npm run dev        # Development (nodemon)
# or
npm start          # Production
```

The API runs on **http://localhost:3000**

> On first boot the server automatically hashes the plain-text passwords in `data/users.json`.

### 2. Frontend

```bash
cd client
npm install
npm start          # ng serve — proxy forwards /api/* to localhost:3000
```

The app runs on **http://localhost:4200**

---

## Default Credentials

| Role  | Username | Password   |
|-------|----------|------------|
| Admin | `admin`  | `Admin@123`|
| User  | `user`   | `User@123` |

---

## Tech Stack

### Frontend
| Tool | Purpose |
|------|---------|
| Angular 20 | Framework (Standalone + Signals) |
| PrimeNG 19 | UI Components |
| Apache ECharts | Dashboard charts |
| SCSS | Styling + theming |
| RxJS | Reactive data streams |

### Backend
| Tool | Purpose |
|------|---------|
| Express 4 | HTTP server |
| JSON Web Tokens | Auth (access + refresh) |
| bcryptjs | Password hashing |
| Helmet | Security headers |
| express-rate-limit | Rate limiting |
| Joi | Request validation |

---

## API Endpoints

### Auth
```
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
```

### Tickets
```
GET    /api/tickets?page=1&limit=10&search=&status=&priority=&category=
GET    /api/tickets/:id
POST   /api/tickets
PUT    /api/tickets/:id
DELETE /api/tickets/:id
```

### AI Assistant
```
GET    /api/ai/:id           (auto-analyze ticket)
POST   /api/ai/:id           (ask a question about ticket)
```

### Dashboard
```
GET    /api/dashboard/stats
GET    /api/dashboard/status-summary
GET    /api/dashboard/priority-summary
GET    /api/dashboard/category-summary
```

---

## Features

- **JWT Authentication** with transparent access-token refresh
- **Ticket Management** – create, view, update, delete tickets with status/priority/category
- **AI Assistant Panel** – per-ticket AI chat: auto-analysis on open + free-text Q&A
- **Dark / Light theme** toggle with CSS custom properties
- **XSS protection** – custom validators + sanitization (frontend) and Joi + regex patterns (backend)
- **Server-side pagination** and debounced search with multi-filter (status, priority, category)
- **Apache ECharts** dashboard (donut by status + bar by priority)
- **PrimeNG** table, dialogs, toast, confirm-dialog
- **Atomic JSON writes** (temp-rename strategy) to prevent file corruption
- **Rate limiting** – global + stricter on auth routes
- **Responsive layout** with fixed sidebar and top navbar
- **Environment-aware** URL configuration (proxy in dev, absolute in prod)

---

## Production Checklist

- [ ] Replace `.env` secrets with strong random values (≥ 32 chars)
- [ ] Set `NODE_ENV=production`
- [ ] Update `CLIENT_URL` to your production domain
- [ ] Update `environment.production.ts` `apiUrl` to your production API
- [ ] Run `ng build` and serve `dist/tms-client` from a static host or Express
