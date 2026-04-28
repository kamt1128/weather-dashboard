# Shared dependencies layer
FROM node:20-alpine AS base

WORKDIR /app

COPY package*.json ./
RUN npm ci

# Development stage (used by docker-compose local)
FROM base AS dev

COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]

# Build stage (used by production runtime)
FROM base AS builder

COPY . .
RUN npm run build

# Production runtime (nginx)
FROM nginx:alpine AS production

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
