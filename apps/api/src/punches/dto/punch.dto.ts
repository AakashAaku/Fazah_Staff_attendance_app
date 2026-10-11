import { IsString, IsNotEmpty, IsEnum, IsOptional, IsNumber, IsObject } from 'class-validator';
import { PunchType } from '../entities/punch.entity';

export class ChallengeResponseDto {
  challengeId: string;
  expiresAt: Date;
}

export class KioskPunchDto {
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @IsString()
  @IsNotEmpty()
  pin: string;

  @IsEnum(PunchType)
  type: PunchType;

  // Ideally this would be handled via multipart/form-data for file uploads, 
  // but for JSON representation (or base64 encoded photo testing):
  @IsString()
  @IsOptional()
  photoBase64?: string;

  @IsString()
  @IsOptional()
  challengeId?: string;

  @IsString()
  @IsOptional()
  idempotencyKey?: string;

  @IsObject()
  @IsOptional()
  clientMeta?: Record<string, any>;
}

export class MobilePunchDto {
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @IsString()
  @IsNotEmpty()
  qrPayload: string;

  @IsString()
  @IsNotEmpty()
  qrSignature: string;

  @IsEnum(PunchType)
  type: PunchType;

  @IsObject()
  @IsOptional()
  clientMeta?: Record<string, any>;

  @IsOptional()
  @IsNumber()
  lat?: number;

  @IsOptional()
  @IsNumber()
  lng?: number;
}
