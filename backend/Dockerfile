# ── Build stage ──────────────────────────────────────────────
FROM node:20-alpine AS base

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

# ── Runtime ──────────────────────────────────────────────────
EXPOSE 3000

CMD ["node", "main.js"]
