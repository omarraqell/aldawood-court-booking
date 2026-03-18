FROM node:20

WORKDIR /app

# Copy workspace root configs
COPY package.json tsconfig.base.json ./
COPY apps/api apps/api

# Install all deps from workspace root
RUN npm install --workspace @aldawood/api

# Generate Prisma client
RUN npm --workspace @aldawood/api run prisma:generate

# Build the NestJS app
RUN npm --workspace @aldawood/api run build

# Entrypoint: run migrations, seed, then start
COPY apps/api/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 4000

ENTRYPOINT ["/docker-entrypoint.sh"]
