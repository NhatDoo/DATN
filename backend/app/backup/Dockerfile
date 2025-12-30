FROM node:20-alpine

# Install postgresql-client for pg_dump tool
RUN apk add --no-cache postgresql-client

WORKDIR /app

# Copy generic package files
COPY package.json package-lock.json ./

# Copy specific service code
COPY app/backup ./app/backup

# Install dependencies (from root for workspace resolution if needed, but here mostly for local deps)
# Since we copied root package.json, npm install will look for workspaces.
# However, for this standalone service build, we might face issues if we don't copy other referenced workspaces.
# But backup-service has no internal workspace dependencies.
# We will just run install in the service directory to be safe and simple.

WORKDIR /app/app/backup
RUN npm install
RUN npm run build

CMD ["npm", "run", "start:prod"]
