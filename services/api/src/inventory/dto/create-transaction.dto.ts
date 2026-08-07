import { InventoryAction, StockCondition } from "@prisma/client";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from "class-validator";

export class CreateTransactionDto {
  @ApiProperty({ enum: InventoryAction, example: InventoryAction.RECEIVE })
  @IsEnum(InventoryAction)
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

}
