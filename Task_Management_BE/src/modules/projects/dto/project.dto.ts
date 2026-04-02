import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectStatus } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class CreateProjectDto {
  @ApiProperty({ description: 'Project name', example: 'Task Management Platform' })
  @IsString()
  @MinLength(2, { message: 'Project name must be at least 2 characters' })
  @MaxLength(180, { message: 'Project name must be at most 180 characters' })
  name: string;

  @ApiPropertyOptional({ description: 'Project description', example: 'Internal platform for task planning and execution' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Project status', enum: ProjectStatus, example: 'ACTIVE' })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiPropertyOptional({ description: 'Color tag', example: '#22C55E' })
  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'Color must be at most 20 characters' })
  color?: string;

  @ApiPropertyOptional({ description: 'Icon key', example: 'rocket' })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Icon must be at most 50 characters' })
  icon?: string;

  @ApiPropertyOptional({ description: 'Project start date (ISO)', example: '2026-04-10' })
  @IsOptional()
  @IsDateString({}, { message: 'startDate must be a valid ISO date string' })
  startDate?: string;

  @ApiPropertyOptional({ description: 'Project end date (ISO)', example: '2026-05-10' })
  @IsOptional()
  @IsDateString({}, { message: 'endDate must be a valid ISO date string' })
  endDate?: string;
}

export class UpdateProjectDto {
  @ApiPropertyOptional({ description: 'Project name', example: 'Task Management Platform V2' })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Project name must be at least 2 characters' })
  @MaxLength(180, { message: 'Project name must be at most 180 characters' })
  name?: string;

  @ApiPropertyOptional({ description: 'Project description', example: 'Enhanced roadmap and sprint support' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Project status', enum: ProjectStatus, example: 'ARCHIVED' })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiPropertyOptional({ description: 'Color tag', example: '#0EA5E9' })
  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'Color must be at most 20 characters' })
  color?: string;

  @ApiPropertyOptional({ description: 'Icon key', example: 'folder' })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Icon must be at most 50 characters' })
  icon?: string;

  @ApiPropertyOptional({ description: 'Project start date (ISO)', example: '2026-04-10' })
  @IsOptional()
  @IsDateString({}, { message: 'startDate must be a valid ISO date string' })
  startDate?: string;

  @ApiPropertyOptional({ description: 'Project end date (ISO)', example: '2026-05-10' })
  @IsOptional()
  @IsDateString({}, { message: 'endDate must be a valid ISO date string' })
  endDate?: string;
}

export class ProjectQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search by project name or description', example: 'task' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by project status', enum: ProjectStatus, example: 'ACTIVE' })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;
}
