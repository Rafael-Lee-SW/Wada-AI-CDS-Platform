FROM openjdk:17-jdk-slim

COPY build/libs/backend-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080

ENV PROFILE=prod

ENTRYPOINT ["java", "-jar", "-Dspring.profiles.active=${PROFILE}", "/app.jar"]