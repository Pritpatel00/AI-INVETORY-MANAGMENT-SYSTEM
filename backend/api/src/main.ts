import { createOtelSdk } from "./observability/tracing"; // must stay the FIRST import

import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import { AppModule } from "./app.module";
import { getCorsOptions, getWebAppOrigin } from "./app-security.config";
import { MetricsService } from "./metrics/metrics.service";

async function bootstrap() {
  // Returns null (no tracing at all) unless an exporter is explicitly
  // configured via OTEL_EXPORTER_OTLP_ENDPOINT / OTEL_TRACE_EXPORTER=console.
  const otelSDK = createOtelSdk();
  if (otelSDK) {
    // Start tracing before Nest boots so HTTP/Express, NestJS and Prisma are
    // instrumented from the very first request.
    await otelSDK.start();
    const shutdownTracing = () => {
      void otelSDK.shutdown().finally(() => process.exit(0));
    };
    process.once("SIGTERM", shutdownTracing);
    process.once("SIGINT", shutdownTracing);
  }

  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT ?? 4000);
  const webAppOrigin = getWebAppOrigin();

  // Ensures Nest's onModuleDestroy/beforeApplicationShutdown hooks (e.g.
  // Prisma closing its DB connection pool) run on SIGTERM/SIGINT, so
  // Railway restarts and redeploys don't leave connections dangling.
  app.enableShutdownHooks();

  app.setGlobalPrefix("api");
  app.enableCors(getCorsOptions());
  // Stage 2 metrics: observe public-API requests. The /metrics endpoint is
  // served by MetricsService on a separate 127.0.0.1 listener, not here.
  const metricsService = app.get(MetricsService);
  app.use(metricsService.httpMetricsMiddleware());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle("Nirka Inventory API")
    .setDescription("Inventory, pending transaction and audit-ledger endpoints.")
    .setVersion("0.1")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api/docs", app, document);

  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(
    `Nirka Inventory API listening on port ${port} (env: ${process.env.NODE_ENV ?? "development"}, CORS origin: ${webAppOrigin})`,
  );
}

void bootstrap();
