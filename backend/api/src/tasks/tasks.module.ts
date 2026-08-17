import { Module } from "@nestjs/common";
import { NotificationsModule } from "../notifications/notifications.module";
import { ReservationsModule } from "../reservations/reservations.module";
import { TasksController } from "./tasks.controller";
import { TasksService } from "./tasks.service";

@Module({
  imports: [ReservationsModule, NotificationsModule],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
