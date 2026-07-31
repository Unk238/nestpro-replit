# NestPro — PG & Hostel OS

NestPro is a full-stack operating system for Indian PG (Paying Guest) accommodation and hostel owners. It replaces spreadsheets and WhatsApp threads with a single, structured platform for day-to-day operations.

## Architecture

- **`lib/db`**: Drizzle ORM schema definitions and PostgreSQL database connection singleton.
- **`artifacts/api-server`**: Express REST API server with PostgreSQL & Gemini AI Integration.
- **`artifacts/nestpro`**: Modern React + Vite frontend application built with TailwindCSS, Framer Motion, and Radix UI.

---

## Quick Start Guide

### Prerequisites
- **Node.js 20+**
- **pnpm** (`npm install -g pnpm`)
- **Docker Desktop**

---

### Step 1: Start PostgreSQL with Docker
```bash
docker compose up -d
```

---

### Step 2: Install Monorepo Dependencies
```bash
pnpm install
```

---

### Step 3: Configure Environment Variables
Copy `.env.example` to `artifacts/api-server/.env`:
```bash
cp .env.example artifacts/api-server/.env
```

Edit `artifacts/api-server/.env` and replace `your_gemini_api_key_here` with your actual Google Gemini API key.

---

### Step 4: Push Database Schema
```bash
pnpm db:push
```

---

### Step 5: Start Local Development Servers
```bash
pnpm dev
```

- **Frontend**: http://localhost:5173
- **API Server**: http://localhost:3001/api

---

## Default Login Credentials
- **Email**: `admin@nestpro.in`
- **Password**: Any password
