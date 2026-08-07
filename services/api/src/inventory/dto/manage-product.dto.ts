import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsEmail, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from "class-validator";

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() === "" ? undefined : value;
}

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

  @ApiPropertyOptional()
  @IsOptional() @Transform(({ value }) => optionalString(value)) @IsString() @MaxLength(150)
  supplierName?: string;

  @ApiPropertyOptional()
  @IsOptional() @Transform(({ value }) => optionalString(value)) @IsEmail() @MaxLength(200)
  supplierEmail?: string;

  @ApiPropertyOptional({ description: "Approved supplier assigned to this product." })
  @IsOptional() @IsUUID()
  supplierId?: string;

  @ApiPropertyOptional({ description: "Controlled/high-value item — stock-reducing actions always require manager review (§8.4)." })
  @IsOptional() @IsBoolean()
  controlled?: boolean;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}
