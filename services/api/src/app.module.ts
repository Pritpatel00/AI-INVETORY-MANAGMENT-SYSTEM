import { Module } from "@nestjs/common";

import { AiModule } from "./ai/ai.module";
import { AuthModule } from "./auth/auth.module";
import { HealthModule } from "./health/health.module";
import { InventoryModule } from "./inventory/inventory.module";
import { MetricsModule } from "./metrics/metrics.module";
import { PrismaModule } from "./prisma/prisma.module";
import { SpeechModule } from "./speech/speech.module";
import { SuppliersModule } from "./suppliers/suppliers.module";
import { TasksModule } from "./tasks/tasks.module";

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    HealthModule,
    InventoryModule,
    MetricsModule,
    SpeechModule,
    AiModule,
    SuppliersModule,
    TasksModule,
  ],
})
export class AppModule {}

