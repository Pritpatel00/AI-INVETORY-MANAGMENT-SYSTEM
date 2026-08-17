import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsInt, IsString, IsUUID, MaxLength, Min } from "class-validator";

export class OpeningBalanceDto {
  @ApiProperty() @IsUUID() productId: string;
  @ApiProperty() @IsUUID() locationId: string;
  @ApiProperty({ minimum: 0, example: 100 }) @IsInt() @Min(0) quantity: number;
  @ApiProperty({ minimum: 0, example: 0 }) @IsInt() @Min(0) reservedQuantity: number;
  @ApiProperty({ example: "2026-08-03" }) @IsDateString() effectiveDate: string;
  @ApiProperty({ example: "Opening balance verified during warehouse setup." }) @IsString() @MaxLength(500) reason: string;
}
