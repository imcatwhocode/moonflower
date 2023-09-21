FROM oven/bun:latest as builder
WORKDIR /app
COPY . .
RUN bun install --production
RUN bun build entrypoint.ts --compile --minify

FROM debian:stable-slim
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && \
    apt-get install -y --no-install-recommends postgresql-client-15 gnupg gzip && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

COPY --from=builder /app/entrypoint .
ENTRYPOINT [ "/entrypoint" ]
