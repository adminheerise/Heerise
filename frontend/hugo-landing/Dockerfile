FROM klakegg/hugo:ext-alpine AS builder

WORKDIR /src
COPY . .
RUN hugo --minify

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /src/public /usr/share/nginx/html

EXPOSE 80
