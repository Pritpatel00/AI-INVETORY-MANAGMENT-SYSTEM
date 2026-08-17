import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from "class-validator";

export class ExtractInventoryDto {
  @ApiProperty({
    example: "Received five units of item 402 at Shelf B from Supplier X.",
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
}
