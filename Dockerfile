FROM oven/bun:latest as builder
WORKDIR /app
COPY . .
RUN bun install --production
RUN bun build entrypoint.ts --compile --minify

FROM debian:bookworm-slim
ENV DEBIAN_FRONTEND=noninteractive
RUN apt update && \
    apt install -y --no-install-recommends curl ca-certificates awscli gnupg gzip && \
    echo "deb https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list && \
    curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add - && \
    apt update && \
    apt install -y postgresql-client-16 && \
    apt clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

COPY --from=builder /app/entrypoint .
ENTRYPOINT [ "/entrypoint" ]