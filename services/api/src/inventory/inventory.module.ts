import { Module } from "@nestjs/common";

import { NotificationsModule } from "../notifications/notifications.module";
import { InventoryController } from "./inventory.controller";
import { InventoryService } from "./inventory.service";
import { InventoryRulesEngine } from "./rules/inventory-rules.engine";
import { TasksModule } from "../tasks/tasks.module";

@Module({
  imports: [NotificationsModule, TasksModule],
  controllers: [InventoryController],
  providers: [InventoryService, InventoryRulesEngine],
})
export class InventoryModule {}
