import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { IsBoolean, IsOptional, IsString, MaxLength } from "class-validator";
export class CreateLocationDto {
  @ApiProperty({ example: "SHELF-B" }) @IsString() @MaxLength(50) code: string;
  @ApiProperty({ example: "Shelf B" }) @IsString() @MaxLength(150) name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) description?: string;
}
export class UpdateLocationDto extends PartialType(CreateLocationDto) {
  @ApiPropertyOptional() @IsOptional() @IsBoolean() active?: boolean;
}
