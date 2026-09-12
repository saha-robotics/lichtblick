# Lichtblick for the cluster: the web build behind nginx, nothing else.
#
# The image this replaces carried Caddy with a JWT plugin and a shared HS256
# key, because it also had to authenticate the robot socket. That job has moved
# to the robot gateway (the socket is /api/u/ws/v1/<robot>/foxglove there, and
# the session cookie admits it), so this image only has to serve files.
FROM node:20-alpine AS build
WORKDIR /src
COPY . ./
RUN corepack enable && yarn install --immutable && yarn run web:build:prod

FROM nginxinc/nginx-unprivileged:1.27-alpine
# The layout every session starts from - the panels the old server handed out
# via /assets/config/config.json. Baked into index.html at start, through the
# placeholder the web build leaves for exactly this.
COPY deploy/default-layout.json /lichtblick/default-layout.json
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY deploy/entrypoint.sh /docker-entrypoint.d/40-default-layout.sh
COPY --from=build --chown=nginx:nginx /src/web/.webpack /usr/share/nginx/html
# Still served at the old path, for anything that kept the URL.
COPY deploy/default-layout.json /usr/share/nginx/html/assets/config/config.json
EXPOSE 8080
