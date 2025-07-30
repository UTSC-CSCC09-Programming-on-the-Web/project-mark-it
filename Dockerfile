# Dockerfile adapted from
# https://nodejs.org/en/docs/guides/nodejs-docker-webapp/
FROM node:20 AS build

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install

# Bundle app source
COPY . .

# Build arguments for environment variables
ARG VITE_API_BASE_URL
ARG VITE_SOCKET_URL

# Set environment variables for build
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL

# Build the application
RUN npm run build

# Serve these static files with NGINX.
FROM nginx:1.21.6-alpine
COPY --from=build /usr/src/app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 5173
CMD ["nginx", "-g", "daemon off;"]
