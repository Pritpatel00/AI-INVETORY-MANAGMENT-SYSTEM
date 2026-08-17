import { DiscrepancySeverity, DiscrepancyStatus } from "@prisma/client";
import {
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from "class-validator";
import { Type } from "class-transformer";

export class ListDiscrepanciesDto {
  /** Named dashboard view used by the six discrepancy summary cards. */
  @IsOptional()
  @IsIn([
    "OPEN",
    "AWAITING_RECOUNT",
    "HIGH_PRIORITY",
    "RESOLVED_TODAY",
    "MISSING",
    "EXTRA",
  ])
  view?:
    | "OPEN"
    | "AWAITING_RECOUNT"
    | "HIGH_PRIORITY"
    | "RESOLVED_TODAY"
    | "MISSING"
    | "EXTRA";

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;

  /** Inclusive start of the created-date range. */
  @IsOptional()
  @IsDateString()
  from?: string;

  /** Inclusive end of the created-date range. */
  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsOptional()
  @IsUUID()
  locationId?: string;

  @IsOptional()
  @IsUUID()
  workerId?: string;

  @IsOptional()
  @IsEnum(DiscrepancySeverity)
  severity?: DiscrepancySeverity;

  @IsOptional()
  @IsEnum(DiscrepancyStatus)
  status?: DiscrepancyStatus;

  /** POSITIVE = counted above expected; NEGATIVE = counted below expected. */
  @IsOptional()
  @IsIn(["POSITIVE", "NEGATIVE"])
  difference?: "POSITIVE" | "NEGATIVE";

  @IsOptional()
  @IsIn([
    "createdAt",
    "caseNumber",
    "expectedQuantity",
    "countedQuantity",
    "differenceQuantity",
    "differencePercentage",
    "severity",
    "status",
  ])
  sort?: string;

  @IsOptional()
  @IsIn(["asc", "desc"])
  order?: "asc" | "desc";
}
