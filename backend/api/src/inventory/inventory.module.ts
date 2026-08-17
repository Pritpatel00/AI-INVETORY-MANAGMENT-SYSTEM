import { Module } from "@nestjs/common";

import { InventoryController } from "./inventory.controller";
import { InventoryService } from "./inventory.service";
import { InventoryRulesEngine } from "./rules/inventory-rules.engine";
import { LocationResolverService } from "./location-resolver.service";
import { TasksModule } from "../tasks/tasks.module";
import { DiscrepanciesModule } from "../discrepancies/discrepancies.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { ReservationsModule } from "../reservations/reservations.module";

@Module({
  imports: [TasksModule, DiscrepanciesModule, NotificationsModule, ReservationsModule],
  controllers: [InventoryController],
  providers: [InventoryService, InventoryRulesEngine, LocationResolverService],
  exports: [LocationResolverService],
})
export class InventoryModule {}
