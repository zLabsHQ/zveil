# zveil-scanner — view-only Zcash detection service
# Build:  docker build -t zveil-scanner services/scanner
# Run:    docker run -p 8080:8080 -e SCANNER_MODE=chain -e ZCASH_NETWORK=testnet \
#           -e LIGHTWALLETD_URL=https://testnet.zec.rocks:443 zveil-scanner

FROM rust:1.87-bookworm AS build
WORKDIR /app
COPY Cargo.toml Cargo.lock ./
COPY src ./src
RUN cargo build --release --locked

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/target/release/zveil-scanner /usr/local/bin/zveil-scanner

ENV PORT=8080 \
    SCANNER_MODE=chain \
    ZCASH_NETWORK=testnet \
    LIGHTWALLETD_URL=https://testnet.zec.rocks:443 \
    CONFIRMATIONS_REQUIRED=3
EXPOSE 8080
CMD ["zveil-scanner"]
