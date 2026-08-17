import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from "class-validator";

export class ApproveDiscrepancyDto {
  @ApiProperty({ example: "Count confirmed against the shelf record." })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  note: string;
}

export class RequestRecountDto {
  @ApiProperty({ example: "Count the full shelf again and call back the number." })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  instructions: string;

  @ApiPropertyOptional({
    description: "Warehouse Executive the recount task is assigned to. Defaults to the original worker.",
  })
  @IsOptional()
  @IsUUID()
  assignedWorkerId?: string;
}

export class RejectDiscrepancyDto {
  @ApiProperty({ example: "The counted quantity cannot be confirmed." })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;
}

export class ResolveTransferDto {
  @ApiProperty({ description: "Location the stock is moved from." })
  @IsUUID()
  sourceLocationId: string;

  @ApiProperty({ description: "Location the stock is moved to." })
  @IsUUID()
  destinationLocationId: string;

  @ApiProperty({ example: "Stock was physically found in Storage 1 but recorded in Packing." })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  note: string;
}
