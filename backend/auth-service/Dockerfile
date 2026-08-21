FROM eclipse-temurin:17-jdk-alpine AS builder
WORKDIR /app
COPY backend/auth-service/pom.xml ./backend/auth-service/
COPY backend/auth-service/src ./backend/auth-service/src
COPY pom.xml .
RUN apk add --no-cache maven && \
    cd backend/auth-service && \
    mvn clean package -DskipTests -q

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN apk add --no-cache curl
COPY --from=builder /app/backend/auth-service/target/*.jar app.jar
EXPOSE 8081
HEALTHCHECK --interval=15s --timeout=5s --retries=5 \
  CMD curl -f http://localhost:8081/actuator/health || exit 1
ENTRYPOINT ["java", "-jar", "app.jar"]
