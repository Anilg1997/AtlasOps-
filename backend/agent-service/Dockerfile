# Multi-stage build for Agent Service
FROM eclipse-temurin:17-jdk-alpine AS builder
WORKDIR /app
COPY backend/agent-service/pom.xml ./backend/agent-service/
COPY backend/agent-service/src ./backend/agent-service/src
COPY pom.xml .
RUN apk add --no-cache maven && \
    cd backend/agent-service && \
    mvn clean package -DskipTests -q

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN apk add --no-cache curl
COPY --from=builder /app/backend/agent-service/target/*.jar app.jar
EXPOSE 8084
HEALTHCHECK --interval=15s --timeout=5s --retries=5 \
  CMD curl -f http://localhost:8084/actuator/health || exit 1
ENTRYPOINT ["java", "-jar", "app.jar"]
