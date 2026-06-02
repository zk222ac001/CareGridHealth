# CareGrid Health Platform

Professional healthcare technology website for CareGrid Health.

## Stack
- React + TypeScript + Vite
- Tailwind CSS
- Node.js + Express
- PostgreSQL + Prisma
- OpenAI-ready AI consultant endpoint

## Quick Start

```bash
npm run install:all
cp backend/.env.example backend/.env
npm run dev
```

## Database

```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

## Environment Variables
See `backend/.env.example`.
