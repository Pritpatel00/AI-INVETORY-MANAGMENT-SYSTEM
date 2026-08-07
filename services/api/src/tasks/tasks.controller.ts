import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { TaskStatus } from "@prisma/client";
import type { AuthenticatedRequest } from "../auth/auth-user";
import { Roles } from "../auth/roles.decorator";
import { CreateTaskDto } from "./create-task.dto";
import { TasksService } from "./tasks.service";

@ApiTags("tasks") @ApiBearerAuth() @Roles("worker", "manager", "administrator") @Controller("tasks")
export class TasksController {
  constructor(private readonly tasks: TasksService) {}
  @Get() list(@Req() request: AuthenticatedRequest) { return this.tasks.list(request.authUser!); }
  @Get("assignees") @Roles("manager") assignees() { return this.tasks.listAssignees(); }
  @Post() @Roles("manager") create(@Body() input: CreateTaskDto) { return this.tasks.create(input); }
  @Post(":id/start") start(@Param("id", new ParseUUIDPipe()) id: string, @Req() request: AuthenticatedRequest) { return this.tasks.changeStatus(id, TaskStatus.IN_PROGRESS, request.authUser!); }
  @Post(":id/complete") complete(@Param("id", new ParseUUIDPipe()) id: string, @Req() request: AuthenticatedRequest) { return this.tasks.changeStatus(id, TaskStatus.COMPLETED, request.authUser!); }
}
