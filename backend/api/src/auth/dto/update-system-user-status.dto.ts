import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean } from "class-validator";

export class UpdateSystemUserStatusDto {
  @ApiProperty()
  @IsBoolean()
  active: boolean;
}
