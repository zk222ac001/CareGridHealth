# Run CareGrid Health with Docker

## Requirements

- Docker Desktop or Docker Engine
- Docker Compose v2

## 1. Configure environment variables

From the project root:

```bash
cp .env.docker.example .env
```

Optional: edit `.env` and add your OpenAI API key and email SMTP credentials.

## 2. Build and start all services

```bash
docker compose up --build
```

This starts:

- Frontend: http://localhost:5173
- Backend API: http://localhost:4000
- PostgreSQL: localhost:5432

## 3. Test backend health

```bash
curl http://localhost:4000/api/health
```

Expected response:

```json
{"ok":true,"service":"CareGrid Health API"}
```

## 4. Stop containers

```bash
docker compose down
```

## 5. Stop and delete database volume

Use this only if you want to reset all database data:

```bash
docker compose down -v
```

## Useful commands

View logs:

```bash
docker compose logs -f
```

View backend logs only:

```bash
docker compose logs -f backend
```

Restart backend:

```bash
docker compose restart backend
```

Open PostgreSQL shell:

```bash
docker exec -it caregrid-postgres psql -U postgres -d caregrid_health
```
