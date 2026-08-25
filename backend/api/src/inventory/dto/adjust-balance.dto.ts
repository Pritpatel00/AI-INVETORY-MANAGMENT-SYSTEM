import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsString, IsUUID, MaxLength, Min } from "class-validator";
export class AdjustBalanceDto {
  @ApiProperty() @IsUUID() balanceId: string;
  @ApiProperty({ minimum: 0 }) @IsInt() @Min(0) quantity: number;
  @ApiProperty() @IsString() @MaxLength(500) reason: string;
}
