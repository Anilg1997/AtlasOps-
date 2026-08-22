FROM node:20-alpine AS build
WORKDIR /app
COPY frontend/intellops-ui/package.json frontend/intellops-ui/package-lock.json ./
RUN npm ci
COPY frontend/intellops-ui/ .
RUN npm run build:prod

FROM nginx:1.27-alpine
COPY --from=build /app/dist/intellops-ui/browser /usr/share/nginx/html
COPY frontend/intellops-ui/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/health || exit 1
