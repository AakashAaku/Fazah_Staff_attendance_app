import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import type { Role } from '../../auth/role.enum';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  role?: Role;

  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsString()
  role?: Role;

  @IsOptional()
  @IsString()
  status?: string;
}
