import { IsString, IsNotEmpty, IsOptional, IsEnum, IsIP } from 'class-validator';

export class RegisterDeviceDto {
  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @IsString()
  @IsNotEmpty()
  type: 'kiosk' | 'phone';

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  branchId: string;

  @IsString()
  @IsOptional()
  publicKey?: string;

  @IsString()
  @IsNotEmpty()
  credentialHash: string; // The hashed shared secret/token from device
}

export class ApproveDeviceDto {
  @IsEnum(['active', 'revoked'])
  @IsNotEmpty()
  status: 'active' | 'revoked';
}
