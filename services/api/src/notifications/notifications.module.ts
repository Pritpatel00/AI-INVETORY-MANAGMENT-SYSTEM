import { Module } from "@nestjs/common";

import { NotificationQueueService } from "./notifications.service";

@Module({
  providers: [NotificationQueueService],
  exports: [NotificationQueueService],
})
export class NotificationsModule {}
