# Karateskillz-Dojo

Karate Skillz Dojo is an enterprise e-commerce platform for karate supplies and dojo services. Built with a React frontend and Node.js backend, the system is hosted on a VM environment using a PostgreSQL database to manage secure product inventory and service scheduling.

## Quick Start

### Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env` and add your PostgreSQL VM credentials (see `.env.example` for format). Then:

```bash
npm start
```

API runs at `http://localhost:3001`. Mock inventory at `GET /api/inventory`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs at `http://localhost:5173` and proxies `/api` to the backend.
