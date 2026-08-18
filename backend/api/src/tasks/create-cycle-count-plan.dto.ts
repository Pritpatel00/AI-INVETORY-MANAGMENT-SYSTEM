import { TaskPriority } from "@prisma/client";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsDateString, IsEnum, IsOptional, IsString, IsUUID, Matches, MaxLength } from "class-validator";

export class CreateCycleCountPlanDto {
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, { message: "periodMonth must use YYYY-MM format" })
  periodMonth: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @IsUUID("4", { each: true })
  locationIds: string[];

  @IsUUID()
  assignedToId: string;

  @IsEnum(TaskPriority)
  priority: TaskPriority;

  @IsOptional()
  @IsDateString()
  dueAt?: string;

  @IsOptional()
  @IsBoolean()
  blindCount?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  instructions?: string;
}
