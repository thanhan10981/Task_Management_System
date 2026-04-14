import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectMemberRole, ProjectStatus } from '@prisma/client';
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

  @ApiPropertyOptional({
    description: 'User IDs to add as members while creating project',
    type: [String],
    example: ['7f89e4d4-4c62-4f10-8e29-5eb7e0fb9df1'],
  })
  @IsOptional()
  @IsArray({ message: 'memberIds must be an array of UUID strings' })
  @IsUUID(4, { each: true, message: 'Each member id must be a valid UUID' })
  memberIds?: string[];
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

  @ApiPropertyOptional({
    description: 'User IDs to add as project members during update',
    type: [String],
    example: ['7f89e4d4-4c62-4f10-8e29-5eb7e0fb9df1'],
  })
  @IsOptional()
  @IsArray({ message: 'memberIds must be an array of UUID strings' })
  @IsUUID(4, { each: true, message: 'Each member id must be a valid UUID' })
  memberIds?: string[];
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

export class AddProjectMemberDto {
  @ApiProperty({ description: 'User id to add into project', example: '3a76d18a-10b5-47f5-bf68-f6f4f5f890a0' })
  @IsNotEmpty({ message: 'User id is required' })
  @IsUUID()
  userId: string;

  @ApiPropertyOptional({ description: 'Role for member', enum: ProjectMemberRole, example: 'MEMBER' })
  @IsOptional()
  @IsEnum(ProjectMemberRole)
  role?: ProjectMemberRole;
}

export class UpdateProjectMemberRoleDto {
  @ApiProperty({ description: 'Updated role for member', enum: ProjectMemberRole, example: 'ADMIN' })
  @IsNotEmpty({ message: 'Role is required' })
  @IsEnum(ProjectMemberRole)
  role: ProjectMemberRole;
}
