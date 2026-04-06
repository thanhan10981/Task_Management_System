import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SprintStatus } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class CreateSprintDto {
  @ApiProperty({ description: 'Project id', example: '11111111-1111-1111-1111-111111111111' })
  @IsUUID()
  projectId: string;

  @ApiProperty({ description: 'Sprint name', example: 'Sprint 1 - Platform Setup' })
  @IsString()
  @MinLength(2, { message: 'Sprint name must be at least 2 characters' })
  @MaxLength(150, { message: 'Sprint name must be at most 150 characters' })
  name: string;

  @ApiPropertyOptional({ description: 'Sprint goal', example: 'Ship authentication and project modules' })
  @IsOptional()
  @IsString()
  goal?: string;

  @ApiPropertyOptional({ description: 'Sprint description', example: 'Focus on backend API milestones for v1' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Sprint status', enum: SprintStatus, example: 'PLANNING' })
  @IsOptional()
  @IsEnum(SprintStatus)
  status?: SprintStatus;

  @ApiPropertyOptional({ description: 'Sprint start date (ISO)', example: '2026-04-10T08:00:00.000Z' })
  @IsOptional()
  @IsDateString({}, { message: 'startDate must be a valid ISO date string' })
  startDate?: string;

  @ApiPropertyOptional({ description: 'Sprint end date (ISO)', example: '2026-04-24T17:00:00.000Z' })
  @IsOptional()
  @IsDateString({}, { message: 'endDate must be a valid ISO date string' })
  endDate?: string;

  @ApiPropertyOptional({ description: 'Sprint completion date (ISO)', example: '2026-04-24T17:00:00.000Z' })
  @IsOptional()
  @IsDateString({}, { message: 'completedAt must be a valid ISO date string' })
  completedAt?: string;
}

export class UpdateSprintDto {
  @ApiPropertyOptional({ description: 'Sprint name', example: 'Sprint 1 - Core Modules' })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Sprint name must be at least 2 characters' })
  @MaxLength(150, { message: 'Sprint name must be at most 150 characters' })
  name?: string;

  @ApiPropertyOptional({ description: 'Sprint goal', example: 'Finalize auth, projects, tasks and sprints' })
  @IsOptional()
  @IsString()
  goal?: string;

  @ApiPropertyOptional({ description: 'Sprint description', example: 'Add tests and polish API responses' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Sprint status', enum: SprintStatus, example: 'ACTIVE' })
  @IsOptional()
  @IsEnum(SprintStatus)
  status?: SprintStatus;

  @ApiPropertyOptional({ description: 'Sprint start date (ISO)', example: '2026-04-10T08:00:00.000Z' })
  @IsOptional()
  @IsDateString({}, { message: 'startDate must be a valid ISO date string' })
  startDate?: string;

  @ApiPropertyOptional({ description: 'Sprint end date (ISO)', example: '2026-04-24T17:00:00.000Z' })
  @IsOptional()
  @IsDateString({}, { message: 'endDate must be a valid ISO date string' })
  endDate?: string;

  @ApiPropertyOptional({ description: 'Sprint completion date (ISO)', example: '2026-04-24T17:00:00.000Z' })
  @IsOptional()
  @IsDateString({}, { message: 'completedAt must be a valid ISO date string' })
  completedAt?: string;
}

export class SprintQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by project id', example: '11111111-1111-1111-1111-111111111111' })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({ description: 'Filter by sprint status', enum: SprintStatus, example: 'ACTIVE' })
  @IsOptional()
  @IsEnum(SprintStatus)
  status?: SprintStatus;
}
