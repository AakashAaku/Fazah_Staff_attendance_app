import { IsString, IsOptional, IsUUID, IsEnum, IsDateString } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsUUID()
  assignedToId: string;

  @IsUUID()
  branchId: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

export class UpdateTaskStatusDto {
  @IsEnum(['pending', 'in_progress', 'paused', 'completed', 'cancelled'])
  status: string;

  @IsOptional()
  @IsString()
  pauseReason?: string;

  @IsOptional()
  @IsString()
  employeeId?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
