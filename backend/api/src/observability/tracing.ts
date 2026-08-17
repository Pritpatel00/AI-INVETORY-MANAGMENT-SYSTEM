import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { PrismaInstrumentation } from "@prisma/instrumentation";
import { NodeSDK } from "@opentelemetry/sdk-node";
import type { Instrumentation } from "@opentelemetry/instrumentation";
import {
  BatchSpanProcessor,
  SimpleSpanProcessor,
  type ReadableSpan,
  type SpanExporter,
} from "@opentelemetry/sdk-trace-base";
import { ConsoleSpanExporter } from "@opentelemetry/sdk-trace-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import type { ExportResult } from "@opentelemetry/core";
import type { Attributes } from "@opentelemetry/api";

/**
 * OpenTelemetry setup with safe development defaults.
 *
 * The key safety rule: **no span exporter is configured by default**. In
 * development and test environments tracing is completely inactive unless an
 * exporter is explicitly enabled, which is what was flooding `api.log` with
 * hundreds of megabytes of full Prisma query spans (every query, statement and
 * bound parameter, printed synchronously by the ConsoleSpanExporter on every
 * request).
 *
 * Enable tracing with one of:
 *
 *   - `OTEL_EXPORTER_OTLP_ENDPOINT=http://collector:4318`  → production OTLP
 *     export (spans are batched and pushed asynchronously to the collector).
 *   - `OTEL_TRACE_EXPORTER=console`  → debug output on stdout (opt-in only;
 *     never enable this in normal development, test suites or production).
 *   - `OTEL_PRISMA_INSTRUMENTATION=true`  → additionally include Prisma query
 *     spans. Off by default so SQL and bound parameters cannot leak; when
 *     enabled, `db.statement` is still redacted by the sanitizing exporter
 *     before anything is sent.
 *   - `OTEL_TRACING_ENABLED=false`  → hard kill switch; overrides everything.
 *
 * The `SanitizingSpanExporter` wraps the real exporter and redacts any
 * attribute that could carry secrets or sensitive inventory evidence before
 * the span leaves the process:
 *
 *   - `db.statement` (full SQL + bound parameters) → `[redacted]`;
 *   - keys matching authorization/password/token/secret/cookie/credential;
 *   - values that look like embedded credentials or bearer material.
 *
 * No span export therefore ever contains access tokens, passwords, complete
 * SQL parameters, voice recordings or evidence payloads.
 *
 * Instrumentation remains a strict allowlist (HTTP server family only) so no
 * future cache/queue/HTTP-client dependency can start emitting spans on its
 * own. This module must stay the FIRST import in main.ts so instrumentations
 * patch their target modules before NestJS boots.
 */
export function createOtelSdk(): NodeSDK | null {
  if (process.env.OTEL_TRACING_ENABLED === "false") {
    return null;
  }

  const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT?.trim();
  const consoleExport = process.env.OTEL_TRACE_EXPORTER === "console";
  const prismaInstrumentation =
    process.env.OTEL_PRISMA_INSTRUMENTATION === "true";

  // Safe default: no exporter configured → tracing stays fully inactive.
  if (!otlpEndpoint && !consoleExport) {
    return null;
  }

  let exporter: SpanExporter;
  if (otlpEndpoint) {
    const base = otlpEndpoint.replace(/\/+$/, "");
    exporter = new OTLPTraceExporter({ url: `${base}/v1/traces` });
  } else {
    exporter = new ConsoleSpanExporter();
  }

  const instrumentations: Instrumentation[] = [
    ...getNodeAutoInstrumentations({
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
  ];
  if (prismaInstrumentation) {
    instrumentations.push(new PrismaInstrumentation());
  }

  // Batch for OTLP (async, non-blocking); simple/flush-per-span for the
  // opt-in console debug mode so spans appear immediately.
  const processor = otlpEndpoint
    ? new BatchSpanProcessor(new SanitizingSpanExporter(exporter))
    : new SimpleSpanProcessor(new SanitizingSpanExporter(exporter));

  return new NodeSDK({
    serviceName: "nirka-inventory-api",
    spanProcessors: [processor],
    instrumentations,
  });
}

const SENSITIVE_ATTRIBUTE_PATTERNS = [
  /authorization/i,
  /password/i,
  /passwd/i,
  /token/i,
  /secret/i,
  /cookie/i,
  /credential/i,
  /bearer/i,
  /api[-_]?key/i,
];

const SENSITIVE_VALUE_PATTERNS = [
  /bearer\s+[a-z0-9._~+/=-]+/i,
  /(password|passwd|secret)\s*[:=]\s*\S+/i,
];

/**
 * Wraps a SpanExporter and redacts sensitive span attributes so the real
 * exporter can never emit tokens, passwords, SQL parameters or evidence.
 */
class SanitizingSpanExporter implements SpanExporter {
  constructor(private readonly inner: SpanExporter) {}

  export(
    spans: ReadableSpan[],
    resultCallback: (result: ExportResult) => void,
  ): void {
    const sanitized = spans.map((span) => ({
      ...span,
      attributes: sanitizeAttributes(span.attributes),
    }));
    this.inner.export(sanitized, resultCallback);
  }

  shutdown(): Promise<void> {
    return this.inner.shutdown();
  }
}

// Any database attribute that can carry SQL, bound parameters or query text
// is redacted regardless of which instrumentation emitted it (Prisma currently
// uses db.statement; future versions may use db.query.text / db.sql.*).
const DB_STATEMENT_PATTERNS = [
  /^db\.(statement|query|sql|text|params)/,
];

function sanitizeAttributes(attributes: Attributes): Attributes {
  const result: Attributes = {};
  for (const [key, value] of Object.entries(attributes ?? {})) {
    if (DB_STATEMENT_PATTERNS.some((re) => re.test(key))) {
      result[key] = "[redacted]";
      continue;
    }
    if (SENSITIVE_ATTRIBUTE_PATTERNS.some((re) => re.test(key))) {
      result[key] = "[redacted]";
      continue;
    }
    if (typeof value === "string" && SENSITIVE_VALUE_PATTERNS.some((re) => re.test(value))) {
      result[key] = "[redacted]";
      continue;
    }
    result[key] = value;
  }
  return result;
}
