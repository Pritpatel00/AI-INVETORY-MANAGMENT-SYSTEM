import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength, MinLength } from "class-validator";

export class ResetSystemUserPasswordDto {
  @ApiProperty({ example: "Temporary@456" })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  temporaryPassword: string;
}
