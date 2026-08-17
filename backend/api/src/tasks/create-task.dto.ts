import { TaskPriority, TaskType } from "@prisma/client";
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from "class-validator";
export class CreateTaskDto {
  @IsEnum(TaskType) type: TaskType;
  @IsEnum(TaskPriority) priority: TaskPriority;
  @IsString() @MaxLength(150) title: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
  @IsOptional() @IsDateString() dueAt?: string;
  @IsUUID() assignedToId: string;
  @IsOptional() @IsUUID() productId?: string;
  @IsOptional() @IsUUID() locationId?: string;
  @IsOptional() @IsInt() @Min(1) quantity?: number;
  @IsOptional() @IsUUID() sourceLocationId?: string;
  @IsOptional() @IsUUID() destinationLocationId?: string;
}
