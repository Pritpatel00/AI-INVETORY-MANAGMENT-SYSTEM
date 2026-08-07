import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsIn, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class UpdateSystemUserDto {
  @ApiProperty({ example: "WH-102" })
  @IsString()
  @Matches(/^[A-Za-z0-9._-]+$/)
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
}
