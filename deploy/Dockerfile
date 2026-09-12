# Lichtblick for the cluster: the web build behind nginx, nothing else.
#
# The image this replaces carried Caddy with a JWT plugin and a shared HS256
# key, because it also had to authenticate the robot socket. That job has moved
# to the robot gateway (the socket is /api/u/ws/v1/<robot>/foxglove there, and
# the session cookie admits it), so this image only has to serve files.
# The web build is architecture-independent - static files - so it runs once, on
# the builder's own platform, and only the nginx stage is assembled per
# architecture. Without this an arm64 image would mean webpack under QEMU.
FROM --platform=$BUILDPLATFORM node:22-alpine AS build
WORKDIR /src
COPY . ./
RUN corepack enable && yarn install --immutable && yarn run web:build:prod
# The default layout goes into index.html here, at build time. The runtime image
# serves as an unprivileged user and owns none of the files it serves, so it
# cannot do this at start - the first attempt crashed on exactly that.
RUN node deploy/bake-layout.js web/.webpack/index.html deploy/default-layout.json /layouts/saha-default.json

FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build --chown=nginx:nginx /src/web/.webpack /usr/share/nginx/html
# The layout every session starts from, also at the old path for anything that kept the URL.
COPY deploy/default-layout.json /usr/share/nginx/html/assets/config/config.json
EXPOSE 8080
