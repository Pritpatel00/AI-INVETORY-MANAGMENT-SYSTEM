import { Module } from "@nestjs/common";

import { AiModule } from "./ai/ai.module";
import { AuthModule } from "./auth/auth.module";
import { HealthModule } from "./health/health.module";
import { InventoryModule } from "./inventory/inventory.module";
import { MetricsModule } from "./metrics/metrics.module";
import { PrismaModule } from "./prisma/prisma.module";
import { SpeechModule } from "./speech/speech.module";
import { TasksModule } from "./tasks/tasks.module";
import { DiscrepanciesModule } from "./discrepancies/discrepancies.module";
import { EvidenceModule } from "./evidence/evidence.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { SetupModule } from "./setup/setup.module";

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    HealthModule,
    InventoryModule,
    MetricsModule,
    SpeechModule,
    AiModule,
    TasksModule,
    DiscrepanciesModule,
    EvidenceModule,
    NotificationsModule,
    SetupModule,
  ],
})
export class AppModule {}
