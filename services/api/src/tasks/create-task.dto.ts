import { TaskPriority, TaskType } from "@prisma/client";
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";
export class CreateTaskDto {
  @IsEnum(TaskType) type: TaskType;
  @IsEnum(TaskPriority) priority: TaskPriority;
  @IsString() @MaxLength(150) title: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
  @IsOptional() @IsDateString() dueAt?: string;
  @IsUUID() assignedToId: string;
  @IsOptional() @IsUUID() productId?: string;
  @IsOptional() @IsUUID() locationId?: string;
}
