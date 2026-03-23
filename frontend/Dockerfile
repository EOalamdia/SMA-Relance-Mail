FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY . .

ARG FRONTEND_BASE_PATH
ARG VITE_API_URL
ARG VITE_APP_NAME
ARG VITE_APP_DESCRIPTION
ARG VITE_THEME_COLOR

ENV FRONTEND_BASE_PATH=${FRONTEND_BASE_PATH}
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_APP_NAME=${VITE_APP_NAME}
ENV VITE_APP_DESCRIPTION=${VITE_APP_DESCRIPTION}
ENV VITE_THEME_COLOR=${VITE_THEME_COLOR}

RUN test -n "${FRONTEND_BASE_PATH}" && test -n "${VITE_API_URL}"
RUN npm run build

FROM nginx:1.25-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
