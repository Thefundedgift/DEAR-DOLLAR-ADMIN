import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class AdminLoginDto {
  // Email or username of the admin (NOT customer mobile, NOT OTP)
  @IsString()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

export class RefreshDto {
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

export class LogoutDto {
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}
