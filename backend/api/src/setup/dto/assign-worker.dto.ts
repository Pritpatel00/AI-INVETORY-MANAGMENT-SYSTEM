import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsUUID, MaxLength } from "class-validator";

export class AssignWorkerDto {
  @ApiProperty({ description: "Active Warehouse Executive (WORKER role) to assign." })
  @IsUUID()
  userId: string;

  @ApiProperty({ example: "Day" })
  @IsString()
  @MaxLength(50)
  shift: string;

  @ApiProperty({ example: "Zone A" })
  @IsString()
  @MaxLength(80)
  warehouseZone: string;
}
