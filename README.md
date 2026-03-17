# HackatonMace

This project contains:

- `backend/`: Express API + PostgreSQL access
- `frontend/`: map website
- `frontend2/`: photo upload website
- `docker-compose.yml`: PostgreSQL + Adminer + API stack

## Prerequisites

- `Node.js` and `npm`
- `Docker` and `Docker Compose`

## Project Structure

```text
HackatonMace/
├── backend/
├── frontend/
├── frontend2/
├── docker-compose.yml
└── env.example
```

## Environment

At the project root, create a `.env` file from `env.example`.

Example:

```bash
cp env.example .env
```

The default Docker setup uses:

- `POSTGRES_USER=admin`
- `POSTGRES_PASSWORD=secret`
- `POSTGRES_DB=mydb`
- `NODE_ENV=development`

## Launch With Docker

From the project root:

```bash
docker compose up --build
```

Services:

- API: `http://localhost:3000`
- Adminer: `http://localhost:8080`
- PostgreSQL: `localhost:5432`

Docker currently starts the backend stack only:

- PostgreSQL
- Adminer
- Express API

The frontend apps (`frontend/` and `frontend2/`) are launched separately with Vite in development.

## Launch Map Frontend Locally

From `frontend/`:

```bash
npm install
npm run dev
```

The Vite dev server will print the local URL, usually:

```text
http://localhost:5173
```

This frontend expects the backend to be running on `http://localhost:3000` through the Vite proxy configuration.

## Launch Photo Upload Frontend Locally

From `frontend2/`:

```bash
npm install
npm run dev
```

The Vite dev server will print the local URL, usually:

```text
http://localhost:5174
```

This frontend also relies on the backend running on `http://localhost:3000` through the Vite proxy configuration.

## Database Initialization

The PostgreSQL schema is defined in:

- [backend/model/schema.sql](/home/shyne/Repositories/Epitech/Tek2/HackatonMace/HackatonMace/backend/model/schema.sql)

With Docker, this schema is loaded automatically on first database initialization through:

```text
./backend/model/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql:ro
```

## Useful Commands

Map frontend:

```bash
cd frontend
npm run dev
```

Upload frontend:

```bash
cd frontend2
npm run dev
```

Docker stack:

```bash
docker compose up --build
```

Stop Docker stack:

```bash
docker compose down
```
