# Reliable local startup

Use one terminal from the project root:

```powershell
npm run start:all
```

The launcher starts or safely reuses PostgreSQL, Keycloak, speech-to-text,
the Runpod-backed AI integration, the NestJS API, and the web application. It refuses to hide an
unhealthy process behind a required port and writes service logs to
`.local/runtime`.

Keep that terminal open while using the application. To stop the services
owned by the launcher from another terminal, run:

```powershell
npm run stop:all
```

The launcher never kills an unrelated process. If a required port is occupied
by an unhealthy process, it reports the process ID so the conflict can be
resolved explicitly.

The Manager dashboard now distinguishes live data from unavailable data. An
API failure is never displayed as zero inventory. The Administrator dashboard
loads health, users, and inventory independently, so one failed section no
longer blanks the whole page.
