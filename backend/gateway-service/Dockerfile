FROM eclipse-temurin:17-jdk-alpine AS builder
WORKDIR /app
COPY backend/gateway-service/pom.xml ./backend/gateway-service/
COPY backend/gateway-service/src ./backend/gateway-service/src
COPY pom.xml .
RUN apk add --no-cache maven && \
    cd backend/gateway-service && \
    mvn clean package -DskipTests -q

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN apk add --no-cache curl
COPY --from=builder /app/backend/gateway-service/target/*.jar app.jar
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=5s --retries=5 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1
ENTRYPOINT ["java", "-jar", "app.jar"]
