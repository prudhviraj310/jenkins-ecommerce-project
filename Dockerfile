# Stage 1: Build the app
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./

# SET THE LEGACY OPENSSL OPTION HERE
ENV NODE_OPTIONS=--openssl-legacy-provider

RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve the app using Nginx
FROM nginx:stable-alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]