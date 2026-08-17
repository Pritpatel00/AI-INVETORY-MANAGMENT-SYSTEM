import { InventoryAction, StockCondition } from "@prisma/client";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from "class-validator";

export const ACTIVE_INVENTORY_ACTIONS: InventoryAction[] = [
  InventoryAction.RECEIVE,
  InventoryAction.SHIP,
  InventoryAction.TRANSFER,
  InventoryAction.CYCLE_COUNT,
  InventoryAction.DAMAGE,
];

export class CreateTransactionDto {
  @ApiProperty({ enum: ACTIVE_INVENTORY_ACTIONS, example: InventoryAction.RECEIVE })
  @IsIn(ACTIVE_INVENTORY_ACTIONS, {
    message:
      "Use stock and Loss actions have been removed. Use Ship for outgoing stock or Damage for unusable stock.",
  })
  action: InventoryAction;

  @ApiProperty({ example: "b6abf8ce-a21f-43a0-83ef-3fd546cf95a4" })
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 50, minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ enum: StockCondition, default: StockCondition.GOOD })
  @IsOptional()
  @IsEnum(StockCondition)
  condition?: StockCondition;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  sourceLocationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  destinationLocationId?: string;

  @ApiPropertyOptional({ example: "ORDER-102" })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  referenceNumber?: string;

  @ApiPropertyOptional({ example: "Outer carton is damaged." })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiPropertyOptional({
    description: "Reviewed voice transcript used to create this transaction.",
  })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  transcript?: string;

  @ApiPropertyOptional({
    description: "Voice evidence record linked to this transaction.",
  })
  @IsOptional()
  @IsUUID()
  evidenceId?: string;

  @ApiPropertyOptional({
    description: "Client-generated id used to prevent duplicate submissions.",
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  clientRequestId?: string;

  @ApiPropertyOptional({
    description: "How the source location was determined: SPOKEN, RECEIVING_DEFAULT, WORKER_ZONE, or CLARIFIED.",
    enum: ["SPOKEN", "RECEIVING_DEFAULT", "WORKER_ZONE", "CLARIFIED"],
  })
  @IsOptional()
  @IsString()
  sourceLocationSource?: string;

  @ApiPropertyOptional({
    description: "How the destination location was determined: SPOKEN, RECEIVING_DEFAULT, WORKER_ZONE, or CLARIFIED.",
    enum: ["SPOKEN", "RECEIVING_DEFAULT", "WORKER_ZONE", "CLARIFIED"],
  })
  @IsOptional()
  @IsString()
  destinationLocationSource?: string;

  @ApiPropertyOptional({
    description:
      "When a worker performs a recount task, the recount task this cycle count is the result of. Links the result to the original discrepancy instead of creating a new case.",
  })
  @IsOptional()
  @IsUUID()
  recountTaskId?: string;

  @ApiPropertyOptional({
    description:
      "When a worker confirms an assigned reservation shipment task by voice, the SHIP task the transaction is the result of. Links the transaction to the task so the reservation-aware shipment movement is applied on confirmation.",
  })
  @IsOptional()
  @IsUUID()
  taskId?: string;

}
