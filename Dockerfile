FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json .

RUN npm ci --only=production

COPY . .

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/ /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup \
    && mkdir -p /app/output \
    && chown -R appuser:appgroup /app/output
USER appuser

EXPOSE 3000

CMD ["npm", "start"]


