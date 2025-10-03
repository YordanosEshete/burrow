FROM gradle:8.14.3-jdk21 AS backend-build
WORKDIR /backend
COPY backend /backend

RUN gradle shadowJar

FROM node:latest AS frontend-build
WORKDIR /frontend
COPY frontend /frontend

ENV VITE_BASE_URL="https://umn.app/api"

RUN npm install --force
RUN npm run build

FROM ubuntu:latest

WORKDIR /app

RUN apt-get -y update
RUN apt-get -y install openjdk-21-jdk
RUN apt-get -y install curl

COPY --from=backend-build /backend/build/libs/*.jar /app/app.jar
COPY --from=frontend-build /frontend/dist /app/frontend

CMD ["java", "-jar", "/app/app.jar"]