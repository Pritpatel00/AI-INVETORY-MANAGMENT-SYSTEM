import { IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";

import { PASSWORD_MIN_LENGTH } from "../auth.constants";

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(254)
  identifier: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  password: string;
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  currentPassword: string;

  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(200)
  newPassword: string;
}

export class InitializeAdministratorPasswordDto {
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(200)
  newPassword: string;
}
