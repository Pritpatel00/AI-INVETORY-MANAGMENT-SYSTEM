import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Req } from "@nestjs/common";
import { IsUUID } from "class-validator";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { TaskStatus } from "@prisma/client";
import type { AuthenticatedRequest } from "../auth/auth-user";
import { Roles } from "../auth/roles.decorator";
import { CreateTaskDto } from "./create-task.dto";
import { CreateCycleCountPlanDto } from "./create-cycle-count-plan.dto";
import { TasksService } from "./tasks.service";

class AssignTaskDto {
  @IsUUID() workerId: string;
}

@ApiTags("tasks") @ApiBearerAuth() @Roles("worker", "manager", "administrator") @Controller("tasks")
export class TasksController {
  constructor(private readonly tasks: TasksService) {}
  @Get() list(@Req() request: AuthenticatedRequest) { return this.tasks.list(request.authUser!); }
  @Get("assignees") @Roles("manager", "administrator") assignees() { return this.tasks.listAssignees(); }
  @Get("cycle-count-plans") @Roles("manager", "administrator") cycleCountPlans() { return this.tasks.listCycleCountPlans(); }
  @Get("cycle-count-plans/:id") @Roles("manager", "administrator")
  cycleCountPlan(@Param("id", new ParseUUIDPipe()) id: string) { return this.tasks.getCycleCountPlan(id); }
  @Post() @Roles("manager", "administrator") create(@Body() input: CreateTaskDto) { return this.tasks.create(input); }
  @Post("cycle-count-plans") @Roles("manager", "administrator") createCycleCountPlan(@Body() input: CreateCycleCountPlanDto) { return this.tasks.createCycleCountPlan(input); }
  @Delete(":id") @Roles("manager", "administrator") remove(@Param("id", new ParseUUIDPipe()) id: string) { return this.tasks.removeOpen(id); }
  @Post(":id/start") start(@Param("id", new ParseUUIDPipe()) id: string, @Req() request: AuthenticatedRequest) { return this.tasks.changeStatus(id, TaskStatus.IN_PROGRESS, request.authUser!); }
  @Post(":id/complete") complete(@Param("id", new ParseUUIDPipe()) id: string, @Req() request: AuthenticatedRequest) { return this.tasks.changeStatus(id, TaskStatus.COMPLETED, request.authUser!); }
  @Post(":id/assign") @Roles("manager", "administrator")
  assign(@Param("id", new ParseUUIDPipe()) id: string, @Body() input: AssignTaskDto, @Req() request: AuthenticatedRequest) { return this.tasks.reassign(id, input.workerId, request.authUser!); }
}
