FROM eclipse-temurin:17-jdk-alpine AS builder
WORKDIR /app
COPY backend/billing-service/pom.xml ./backend/billing-service/
COPY backend/billing-service/src ./backend/billing-service/src
COPY pom.xml .
RUN apk add --no-cache maven && \
    cd backend/billing-service && \
    mvn clean package -DskipTests -q

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN apk add --no-cache curl
COPY --from=builder /app/backend/billing-service/target/*.jar app.jar
EXPOSE 8085
HEALTHCHECK --interval=15s --timeout=5s --retries=5 \
  CMD curl -f http://localhost:8085/actuator/health || exit 1
ENTRYPOINT ["java", "-jar", "app.jar"]
