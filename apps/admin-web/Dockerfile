FROM node:20-alpine

WORKDIR /app

# Copy workspace root configs
COPY package.json tsconfig.base.json ./
COPY apps/admin-web apps/admin-web

# Install deps
RUN npm install --workspace @aldawood/admin-web

# Client-side env vars are baked at build time
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
ARG NEXT_PUBLIC_AGENT_BASE_URL=http://localhost:8000
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_AGENT_BASE_URL=$NEXT_PUBLIC_AGENT_BASE_URL

# Build Next.js
RUN npm --workspace @aldawood/admin-web run build

EXPOSE 3000

CMD ["npm", "--workspace", "@aldawood/admin-web", "run", "start"]
