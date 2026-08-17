import { ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";

export class CreateSetupAssignmentDto {
  @ApiProperty({ description: "Active product to assign to a location." })
  @IsUUID()
  productId: string;

  @ApiProperty({ description: "Active warehouse location that will hold the product." })
  @IsUUID()
  locationId: string;
}
