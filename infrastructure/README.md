# Infrastructure

Local and production deployment configuration belongs here.

The current development configuration provides PostgreSQL for Milestone 2 and
Keycloak for Milestone 3. The Compose file is compatible with `podman compose`.

The local Windows scripts start the isolated PostgreSQL and Keycloak services
stored under `.local`.

Later milestones will add Caddy, Whisper, Ollama, Valkey, SeaweedFS and
monitoring services.

## Observability stack (Prometheus + Loki + Promtail + Grafana)

Stage 2 added Prometheus metrics (`services/api/src/metrics`, served on the
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
`services/api/logs/api.log` (bind-mounted read-only into the promtail
container). Start the API so its output lands there:

```
cd services/api
mkdir -p logs
nohup node dist/main.js > logs/api.log 2>&1 &
```

If you run `npm run api:dev` (or `npm run start`) instead, logs go to the
console and Promtail will tail a stale file — restart the API with the
redirect above to resume shipping.

### Trace-log correlation (future work)

Correlating Stage 1 OTel trace IDs with Loki log lines (promtail structured
metadata + `trace_id` labels) is deliberately deferred — see the comment in
`infrastructure/promtail.yml`.
