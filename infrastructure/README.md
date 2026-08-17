# Infrastructure

Local and production deployment configuration belongs here.

The current development configuration provides PostgreSQL for Milestone 2 and
Keycloak for Milestone 3. The Compose file is compatible with `podman compose`.

The local Windows scripts start the isolated PostgreSQL and Keycloak services
stored under `.local`.

Later milestones will add Caddy, SeaweedFS and additional monitoring
services.

## Observability stack (Prometheus + Loki + Promtail + Grafana)

Stage 2 added Prometheus metrics (`backend/api/src/metrics`, served on the
host at `http://127.0.0.1:9091/metrics`); Stage 3 added Loki (log storage),
Promtail (log shipping) and Grafana (dashboards).

Start/stop everything with:

```
npm run observability:local:start
npm run observability:local:stop
```

### Grafana

- URL: http://localhost:3001
- Default login: `admin` / `nirka-grafana-dev`
- Change `GF_SECURITY_ADMIN_PASSWORD` in `compose.dev.yml` before any shared
  or long-lived deployment — the default is for local development only.
- Datasources (Prometheus, Loki) and the "Nirka Inventory API" starter
  dashboard (request rate, error rate, p95 latency, event-loop lag) are
  provisioned as code under `infrastructure/grafana/`.

### Shipping API logs to Loki

The API runs on the host, so Promtail tails its stdout from
`backend/api/logs/api.log` (bind-mounted read-only into the promtail
container). Start the API so its output lands there:

```
cd backend/api
mkdir -p logs
nohup node dist/src/main.js > logs/api.log 2>&1 &
```

If you run `npm run api:dev` (or `npm run start`) instead, logs go to the
console and Promtail will tail a stale file — restart the API with the
redirect above to resume shipping.

#### Log volume and cleanup

The API only writes useful lines to stdout: NestJS startup/request errors and
important business failures. OpenTelemetry trace spans are **not** exported
unless an exporter is explicitly enabled (see below), so a normal
`api.log` grows by only a few kilobytes per day. Rotate or truncate it safely
at any time — it is git-ignored and contains no business data:

```
# truncate in place (keeps the file so Promtail keeps tailing)
: > backend/api/logs/api.log
# or remove and recreate on the next restart
rm backend/api/logs/api.log
```

### OpenTelemetry tracing (enabled only when configured)

Tracing is **off by default**. No spans are exported in development or test
unless you opt in explicitly:

| Environment variable | Effect |
|---|---|
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Export spans to an OTLP collector (production). Example: `http://collector:4318` → pushes to `/v1/traces`. |
| `OTEL_TRACE_EXPORTER=console` | Debug only: print spans to stdout. Never enable in normal dev, CI or production. |
| `OTEL_PRISMA_INSTRUMENTATION=true` | Include Prisma query spans. Off by default; `db.statement` is redacted regardless. |
| `OTEL_TRACING_ENABLED=false` | Hard kill switch that overrides every other option. |

A `SanitizingSpanExporter` redacts `db.statement` (SQL + bound parameters),
authorization/token/password/secret attributes and credential-like values
before spans leave the process, so access tokens, voice recordings and
sensitive inventory evidence can never be exported.

### Trace-log correlation (future work)

Correlating Stage 1 OTel trace IDs with Loki log lines (promtail structured
metadata + `trace_id` labels) is deliberately deferred — see the comment in
`infrastructure/promtail.yml`.
