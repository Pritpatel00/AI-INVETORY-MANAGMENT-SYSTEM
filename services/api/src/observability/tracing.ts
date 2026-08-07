import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { PrismaInstrumentation } from "@prisma/instrumentation";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { ConsoleSpanExporter } from "@opentelemetry/sdk-trace-node";

/**
 * Stage 1 OpenTelemetry setup.
 *
 * HTTP server + Prisma auto-instrumentation ONLY. BullMQ manual spans are
 * deliberately deferred to a later stage.
 *
 * The auto-instrumentations bundle enables ~30 instrumentations by default, so
 * every non-HTTP entry is explicitly switched off here. This is a strict
 * allowlist — the console trace can only ever contain:
 *
 *   - @opentelemetry/instrumentation-http       → HTTP server layer
 *   - @opentelemetry/instrumentation-express    → Express request lifecycle
 *   - @opentelemetry/instrumentation-router     → router middleware/handlers
 *   - @opentelemetry/instrumentation-nestjs-core → controllers + handlers
 *   - @prisma/instrumentation (PrismaInstrumentation) → Prisma queries
 *
 * Outbound HTTP clients (undici) and every datastore/messaging/library
 * instrumentation (ioredis/redis/pg/net/fs/dns/knex/mysql/... ) are disabled,
 * so the Valkey/BullMQ connections in the notifications module and any future
 * integrations never leak spans into Stage 1 output.
 *
 * Spans are exported to the console for now; a real OTLP collector and
 * Prometheus/Grafana/Loki arrive in later stages.
 *
 * Disable tracing with `OTEL_TRACING_ENABLED=false` (e.g. in noisy logs).
 *
 * This module must be imported as the FIRST import in main.ts so the
 * instrumentations patch their target modules before NestJS boots.
 */
export const otelSDK = new NodeSDK({
  serviceName: "nirka-inventory-api",
  traceExporter: new ConsoleSpanExporter(),
  instrumentations: [
    getNodeAutoInstrumentations({
      // HTTP server family: keep on (documented intent; defaults already on).
      "@opentelemetry/instrumentation-http": { enabled: true },
      "@opentelemetry/instrumentation-express": { enabled: true },
      "@opentelemetry/instrumentation-router": { enabled: true },
      "@opentelemetry/instrumentation-nestjs-core": { enabled: true },
      // Everything else: off for Stage 1.
      "@opentelemetry/instrumentation-undici": { enabled: false },
      "@opentelemetry/instrumentation-fs": { enabled: false },
      "@opentelemetry/instrumentation-dns": { enabled: false },
      "@opentelemetry/instrumentation-net": { enabled: false },
      "@opentelemetry/instrumentation-ioredis": { enabled: false },
      "@opentelemetry/instrumentation-redis": { enabled: false },
      "@opentelemetry/instrumentation-pg": { enabled: false },
      "@opentelemetry/instrumentation-knex": { enabled: false },
      "@opentelemetry/instrumentation-mysql": { enabled: false },
      "@opentelemetry/instrumentation-mysql2": { enabled: false },
      "@opentelemetry/instrumentation-mongodb": { enabled: false },
      "@opentelemetry/instrumentation-mongoose": { enabled: false },
      "@opentelemetry/instrumentation-amqplib": { enabled: false },
      "@opentelemetry/instrumentation-kafkajs": { enabled: false },
      "@opentelemetry/instrumentation-grpc": { enabled: false },
      "@opentelemetry/instrumentation-graphql": { enabled: false },
      "@opentelemetry/instrumentation-connect": { enabled: false },
      "@opentelemetry/instrumentation-koa": { enabled: false },
      "@opentelemetry/instrumentation-hapi": { enabled: false },
      "@opentelemetry/instrumentation-restify": { enabled: false },
      "@opentelemetry/instrumentation-tedious": { enabled: false },
      "@opentelemetry/instrumentation-memcached": { enabled: false },
      "@opentelemetry/instrumentation-lru-memoizer": { enabled: false },
      "@opentelemetry/instrumentation-generic-pool": { enabled: false },
      "@opentelemetry/instrumentation-cassandra-driver": { enabled: false },
      "@opentelemetry/instrumentation-oracledb": { enabled: false },
      "@opentelemetry/instrumentation-dataloader": { enabled: false },
      "@opentelemetry/instrumentation-bunyan": { enabled: false },
      "@opentelemetry/instrumentation-pino": { enabled: false },
      "@opentelemetry/instrumentation-winston": { enabled: false },
      "@opentelemetry/instrumentation-aws-sdk": { enabled: false },
      "@opentelemetry/instrumentation-aws-lambda": { enabled: false },
      "@opentelemetry/instrumentation-openai": { enabled: false },
      "@opentelemetry/instrumentation-host-metrics": { enabled: false },
      "@opentelemetry/instrumentation-runtime-node": { enabled: false },
      "@opentelemetry/instrumentation-cucumber": { enabled: false },
    }),
    new PrismaInstrumentation(),
  ],
});
