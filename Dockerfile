# Stage 1: Build the app
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve the app using Nginx (The Pro Choice)
FROM nginx:stable-alpine
# Copy the build files from Stage 1 to Nginx's html folder
COPY --from=build /app/build /usr/share/nginx/html
# Copy a custom nginx config if needed, or just use default
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]