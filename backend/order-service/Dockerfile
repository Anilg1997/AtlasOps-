FROM eclipse-temurin:17-jdk-alpine AS builder
WORKDIR /app
COPY backend/order-service/pom.xml ./backend/order-service/
COPY backend/order-service/src ./backend/order-service/src
COPY pom.xml .
RUN apk add --no-cache maven && \
    cd backend/order-service && \
    mvn clean package -DskipTests -q

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN apk add --no-cache curl
COPY --from=builder /app/backend/order-service/target/*.jar app.jar
EXPOSE 8083
HEALTHCHECK --interval=15s --timeout=5s --retries=5 \
  CMD curl -f http://localhost:8083/actuator/health || exit 1
ENTRYPOINT ["java", "-jar", "app.jar"]
