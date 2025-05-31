FROM node:lts-alpine as build-stage
WORKDIR /app
 
# Set the environment variables for Vite
ARG VITE_BACKEND_URL
ARG VITE_NODE_ENV
ARG VITE_BACKEND_WEB_SOCKET
ARG VITE_GEMINI_API_KEY
ARG VITE_GEMINI_HOME_URL
ARG VITE_GEMINI_VOICE_MODEL
ARG VITE_GEMINI_MODEL
 
# Set build-time environment variables for Vite
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
ENV VITE_NODE_ENV=$VITE_NODE_ENV
ENV VITE_BACKEND_WEB_SOCKET=$VITE_BACKEND_WEB_SOCKET
ENV VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY
ENV VITE_GEMINI_HOME_URL=$VITE_GEMINI_HOME_URL
ENV VITE_GEMINI_VOICE_MODEL=$VITE_GEMINI_VOICE_MODEL
ENV VITE_GEMINI_MODEL=$VITE_GEMINI_MODEL
 
# Install dependencies and build app
COPY package.json ./
RUN npm install --force
COPY . . 
RUN npm run build
 
# Production stage
FROM nginx:stable as production-stage
RUN apt-get update -y && apt-get install -y apache2-utils && rm -rf /var/lib/apt/lists/*
COPY --from=build-stage /app/dist/ /var/www
RUN rm /etc/nginx/conf.d/default.conf
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
CMD nginx -g "daemon off;"