import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsEmail, IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() === "" ? undefined : value;
}

export class CreateSupplierDto {
  @ApiProperty({ example: "SUP-001" })
  @IsString() @MaxLength(40) code: string;
  @ApiProperty({ example: "Blue Parts Ltd" })
  @IsString() @MaxLength(150) name: string;
  @ApiPropertyOptional() @IsOptional() @Transform(({ value }) => optionalString(value)) @IsString() @MaxLength(120) contactName?: string;
  @ApiPropertyOptional() @IsOptional() @Transform(({ value }) => optionalString(value)) @IsEmail() @MaxLength(200) email?: string;
  @ApiPropertyOptional() @IsOptional() @Transform(({ value }) => optionalString(value)) @IsString() @MaxLength(40) phone?: string;
  @ApiPropertyOptional() @IsOptional() @Transform(({ value }) => optionalString(value)) @IsString() @MaxLength(500) address?: string;
  @ApiProperty({ minimum: 0, default: 0 }) @IsInt() @Min(0) leadTimeDays: number;
  @ApiProperty({ minimum: 0, default: 0 }) @IsInt() @Min(0) minimumOrderQuantity: number;
}

export class UpdateSupplierDto extends PartialType(CreateSupplierDto) {
  @ApiPropertyOptional() @IsOptional() @IsBoolean() active?: boolean;
}
