import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class CreateProductDto {
  @ApiProperty({ example: "ITEM-402" })
  @IsString() @MaxLength(50)
  sku: string;

  @ApiProperty({ example: "Blue Widget" })
  @IsString() @MaxLength(150)
  name: string;

  @ApiProperty({ example: "unit" })
  @IsString() @MaxLength(30)
  unit: string;

  @ApiProperty({ example: 60, minimum: 0 })
  @IsInt() @Min(0)
  safetyStock: number;

  @ApiProperty({ example: 100, minimum: 0 })
  @IsInt() @Min(0)
  reorderQuantity: number;

  @ApiPropertyOptional({ description: "Controlled/high-value item — stock-reducing actions always require manager review (§8.4)." })
  @IsOptional() @IsBoolean()
  controlled?: boolean;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}
