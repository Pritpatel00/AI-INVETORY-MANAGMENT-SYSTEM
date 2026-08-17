import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from "class-validator";

export class CreateSetupOpeningStockDto {
  @ApiProperty()
  @IsUUID()
  productId: string;

  @ApiProperty()
  @IsUUID()
  locationId: string;

  @ApiProperty({ minimum: 0, example: 120 })
  @IsInt()
  @Min(0)
  quantity: number;

  @ApiPropertyOptional({ example: "WHS-OPEN-2026-0001" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference?: string;

  @ApiPropertyOptional({ example: "Opening balance verified from physical count." })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
