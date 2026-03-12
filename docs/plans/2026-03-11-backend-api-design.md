# Backend API Design

## Stack
- Fastify + TypeScript
- Prisma (PostgreSQL)
- ioredis (Redis)
- Deployed to Railway via Dockerfile

## Structure
```
backend/
  src/
    plugins/         # Fastify plugins (db, redis)
    routes/          # Route handlers by resource
    schemas/         # JSON validation schemas
    app.ts           # Fastify app factory
    server.ts        # Entry point
  prisma/
    schema.prisma
  tsconfig.json
  package.json
  Dockerfile
  .env.example
```

## Endpoints

| Method | Path | Description | Cached |
|--------|------|-------------|--------|
| GET | /items | List all items | 60s TTL |
| GET | /items/:id | Get single item | 60s TTL |
| POST | /items | Create item | Invalidates cache |
| PUT | /items/:id | Update item | Invalidates cache |
| DELETE | /items/:id | Delete item | Invalidates cache |
| GET | /health | DB + Redis check | No |

## Item Schema
```
{ id: uuid, name: string, description: string?, createdAt: datetime, updatedAt: datetime }
```

## Caching
- GET: check Redis -> hit: return cached -> miss: query DB, store, return
- Write: perform DB op -> delete `items:list` and `items:{id}` keys
- Keys: `items:list`, `items:{id}`

## Environment Variables
- `DATABASE_URL` - Postgres (Railway-provided)
- `REDIS_URL` - Redis (Railway-provided)
- `PORT` - defaults to 3000 (Railway-provided)
