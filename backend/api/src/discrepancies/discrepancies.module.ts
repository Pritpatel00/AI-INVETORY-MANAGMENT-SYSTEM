import { Module } from "@nestjs/common";

import { DiscrepanciesController } from "./discrepancies.controller";
import { DiscrepanciesService } from "./discrepancies.service";
import { DiscrepancyRulesService } from "./discrepancy-rules.service";
import { DiscrepancyAuditService } from "./discrepancy-audit.service";
import { InventoryRulesEngine } from "../inventory/rules/inventory-rules.engine";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [NotificationsModule],
  controllers: [DiscrepanciesController],
  providers: [
    DiscrepanciesService,
    // DiscrepancyRulesService takes a plain configuration object (not an
    // injectable), so Nest must construct it through a factory instead of
    // resolving its constructor argument from the DI container.
    {
      provide: DiscrepancyRulesService,
      useFactory: () => new DiscrepancyRulesService(),
    },
    DiscrepancyAuditService,
    InventoryRulesEngine,
  ],
  exports: [DiscrepanciesService, DiscrepancyRulesService, DiscrepancyAuditService],
})
export class DiscrepanciesModule {}
