FROM eclipse-temurin:17-jdk-alpine AS builder
WORKDIR /app
COPY backend/notification-service/pom.xml ./backend/notification-service/
COPY backend/notification-service/src ./backend/notification-service/src
COPY pom.xml .
RUN apk add --no-cache maven && \
    cd backend/notification-service && \
    mvn clean package -DskipTests -q

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN apk add --no-cache curl
COPY --from=builder /app/backend/notification-service/target/*.jar app.jar
EXPOSE 8086
HEALTHCHECK --interval=15s --timeout=5s --retries=5 \
  CMD curl -f http://localhost:8086/actuator/health || exit 1
ENTRYPOINT ["java", "-jar", "app.jar"]
