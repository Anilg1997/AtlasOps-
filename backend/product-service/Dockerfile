FROM eclipse-temurin:17-jdk-alpine AS builder
WORKDIR /app
COPY backend/product-service/pom.xml ./backend/product-service/
COPY backend/product-service/src ./backend/product-service/src
COPY pom.xml .
RUN apk add --no-cache maven && \
    cd backend/product-service && \
    mvn clean package -DskipTests -q

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN apk add --no-cache curl
COPY --from=builder /app/backend/product-service/target/*.jar app.jar
EXPOSE 8082
HEALTHCHECK --interval=15s --timeout=5s --retries=5 \
  CMD curl -f http://localhost:8082/actuator/health || exit 1
ENTRYPOINT ["java", "-jar", "app.jar"]
