import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { createServer, type Server } from "node:http";
import {
  collectDefaultMetrics,
  Counter,
  Histogram,
  register,
} from "prom-client";
import type { NextFunction, Request, Response } from "express";

const METRICS_PATH = "/metrics";

/**
 * Stage 2 Prometheus metrics.
 *
 * Metrics are served on a SEPARATE internal HTTP listener bound to
 * 127.0.0.1 (default port 9091, override with METRICS_PORT) instead of a
 * route on the public API listener. This keeps the endpoint unauthenticated
 * (Prometheus scrapers cannot hold JWTs) while ensuring it is NOT reachable
 * through the public listener (:4000) — no CORS, no global prefix, no
 * NestJS pipeline, not in Swagger.
 */
@Injectable()
export class MetricsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MetricsService.name);
  private readonly server: Server;
  private readonly port = Number(process.env.METRICS_PORT ?? 9091);

  // Reuse existing registrations if the service is ever instantiated more
  // than once in a process (prom-client throws on duplicate names).
  private readonly httpRequestDurationSeconds =
    (register.getSingleMetric("http_request_duration_seconds") as
      | Histogram
      | undefined) ??
    new Histogram({
      name: "http_request_duration_seconds",
      help: "HTTP request duration in seconds",
      labelNames: ["method", "route", "status_code"],
      buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    });

  private readonly httpRequestsTotal =
    (register.getSingleMetric("http_requests_total") as Counter | undefined) ??
    new Counter({
      name: "http_requests_total",
      help: "Total number of HTTP requests",
      labelNames: ["method", "route", "status_code"],
    });

  constructor() {
    // Default Node.js process metrics: CPU, memory (resident/virtual/heap),
    // event-loop lag (10ms sampling), active handles/requests, versions.
    collectDefaultMetrics({ register, eventLoopMonitoringPrecision: 10 });

    this.server = createServer((request, response) => {
      if (request.url === METRICS_PATH) {
        register
          .metrics()
          .then((metrics) => {
            response.setHeader("Content-Type", register.contentType);
            response.end(metrics);
          })
          .catch((error: unknown) => {
            this.logger.error("Failed to render metrics", error as Error);
            response.statusCode = 500;
            response.end("Failed to render metrics");
          });
        return;
      }
      response.statusCode = 404;
      response.end("Not found");
    });
  }

  onModuleInit() {
    this.server.on("error", (error) => {
      // A port collision must never take down the API; log and continue.
      this.logger.warn(`Metrics listener not available: ${error.message}`);
    });
    this.server.listen(this.port, "127.0.0.1", () => {
      this.logger.log(
        `Prometheus metrics on http://127.0.0.1:${this.port}${METRICS_PATH}`,
      );
    });
  }

  onModuleDestroy() {
    this.server.close();
  }

  /**
   * Middleware for the PUBLIC API listener. Records duration/count per
   * {method, route, status_code}. Route patterns (e.g.
   * /api/inventory/transactions/:id/approve) keep label cardinality low.
   */
  httpMetricsMiddleware() {
    return (request: Request, response: Response, next: NextFunction) => {
      const startedAt = process.hrtime.bigint();
      response.on("finish", () => {
        const route = this.resolveRoute(request);
        const labels = {
          method: request.method,
          route,
          status_code: String(response.statusCode),
        };
        const seconds = Number(process.hrtime.bigint() - startedAt) / 1e9;
        this.httpRequestDurationSeconds.observe(labels, seconds);
        this.httpRequestsTotal.inc(labels);
      });
      next();
    };
  }

  private resolveRoute(request: Request): string {
    const pattern = request.route?.path;
    if (pattern) return `${request.baseUrl ?? ""}${pattern}` || "unmatched";
    return "unmatched";
  }
}
