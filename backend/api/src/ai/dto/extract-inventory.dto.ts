import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from "class-validator";

export class ExtractInventoryContextDto {
  @ApiPropertyOptional({
    enum: ["RECEIVE", "SHIP", "TRANSFER", "CYCLE_COUNT", "DAMAGE"],
  })
  @IsOptional()
  @IsIn(["RECEIVE", "SHIP", "TRANSFER", "CYCLE_COUNT", "DAMAGE"])
  action?: "RECEIVE" | "SHIP" | "TRANSFER" | "CYCLE_COUNT" | "DAMAGE";

  @ApiPropertyOptional({ description: "Assigned product SKU." })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  productSku?: string;

  @ApiPropertyOptional({ description: "Assigned product name." })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  productName?: string;

  @ApiPropertyOptional({ description: "Assigned source location code." })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  sourceLocationCode?: string;

  @ApiPropertyOptional({ description: "Assigned destination location code." })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  destinationLocationCode?: string;
}

export class ExtractInventoryDto {
  @ApiProperty({
    example: "Received five units of item 402 in Receiving.",
  })
  @IsString()
  @MinLength(2)
  @MaxLength(1000)
  transcript: string;

  @ApiPropertyOptional({
    description: "Voice evidence record associated with the transcript.",
  })
  @IsOptional()
  @IsUUID()
  evidenceId?: string;

  @ApiPropertyOptional({ type: () => ExtractInventoryContextDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ExtractInventoryContextDto)
  context?: ExtractInventoryContextDto;
}
