import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class CreateSystemUserDto {
  @ApiProperty({ example: "WH-102" })
  @IsString()
  @Matches(/^[A-Za-z0-9._-]+$/, {
    message: "Employee ID can contain only letters, numbers, dots, dashes and underscores.",
  })
  @MaxLength(50)
  employeeId: string;

  @ApiProperty({ example: "Ravi Shah" })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  displayName: string;

  @ApiProperty({ example: "ravi.shah@company.com" })
  @IsEmail()
  @MaxLength(150)
  email: string;

  @ApiProperty({ enum: ["WORKER", "MANAGER"] })
  @IsIn(["WORKER", "MANAGER"])
  role: "WORKER" | "MANAGER";

  @ApiPropertyOptional({ example: "Day" })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  shift?: string;

  @ApiPropertyOptional({ example: "Zone A" })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  warehouseZone?: string;

  @ApiProperty({ example: "Temporary@123" })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  temporaryPassword: string;
}
