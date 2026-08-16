# CareGrid Health Platform

Professional healthcare technology website for CareGrid Health.

## Stack
- React + TypeScript + Vite
- Tailwind CSS
- Node.js + Express
- PostgreSQL + Prisma
- Ollama-ready AI consultant endpoint with OpenAI fallback

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

For the AI Consultant, set `OLLAMA_HOST` to your Ollama API host, such as `http://localhost:11434`, and `OLLAMA_MODEL` to the installed model name. The default model is `gemma4`.
