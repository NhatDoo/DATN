FROM node:20-alpine

WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./

# Copy all app sources (this is necessary because of the workspace structure and shared libs)
COPY app ./app

# Install dependencies for all workspaces
RUN npm install

# Argument to specify which service to build
ARG SERVICE_NAME

# Build the specific service
# We go into the service directory to build it, ensuring it uses its own config
# If the service has a prisma directory, generate the client first
RUN if [ -d "app/${SERVICE_NAME}/prisma" ]; then \
      cd app/${SERVICE_NAME} && npx prisma generate; \
    fi

RUN cd app/${SERVICE_NAME} && npm run build

# Expose ports (optional, can be overridden in compose)
EXPOSE 3000

# Set the command to run the service using its own start:prod script
# We use sh -c to allow variable expansion and cd
CMD sh -c "cd app/${SERVICE_NAME} && npm run start:prod"
