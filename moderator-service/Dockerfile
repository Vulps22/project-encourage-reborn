FROM node:20-alpine AS builder
ARG NODE_AUTH_TOKEN
WORKDIR /app
COPY package*.json .npmrc ./
RUN echo "//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}" >> .npmrc
RUN npm ci
RUN rm .npmrc
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json .
CMD ["node", "dist/bot/bot.js"]
