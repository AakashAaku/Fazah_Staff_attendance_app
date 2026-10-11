import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class Verify2FaDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 6)
  token: string;
}
