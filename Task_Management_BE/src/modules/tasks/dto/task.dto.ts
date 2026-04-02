import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskPriority } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { Type } from 'class-transformer';

export class CreateTaskDto {
  @ApiProperty({ description: 'Task title', example: 'Implement auth middleware' })
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  @MaxLength(255, { message: 'Title must be at most 255 characters' })
  title: string;

  @ApiPropertyOptional({ description: 'Task description', example: 'Validate JWT from cookie' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Task priority', enum: TaskPriority, example: 'HIGH' })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({ description: 'Task start date (ISO)', example: '2026-04-02T08:00:00.000Z' })
  @IsOptional()
  @IsDateString({}, { message: 'startDate must be a valid ISO date string' })
  startDate?: string;

  @ApiPropertyOptional({ description: 'Task due date (ISO)', example: '2026-04-05T17:00:00.000Z' })
  @IsOptional()
  @IsDateString({}, { message: 'dueDate must be a valid ISO date string' })
  dueDate?: string;

  @ApiProperty({ description: 'Project id', example: '11111111-1111-1111-1111-111111111111' })
  @IsNotEmpty({ message: 'Project ID is required' })
  @IsUUID()
  projectId: string;

  @ApiProperty({ description: 'Status id', example: '22222222-2222-2222-2222-222222222222' })
  @IsNotEmpty({ message: 'Status ID is required' })
  @IsUUID()
  statusId: string;

  @ApiPropertyOptional({ description: 'Parent task id', example: '33333333-3333-3333-3333-333333333333' })
  @IsOptional()
  @IsUUID()
  parentTaskId?: string;
}

export class UpdateTaskDto {
  @ApiPropertyOptional({ description: 'Task title', example: 'Implement auth middleware v2' })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Title must be at most 255 characters' })
  title?: string;

  @ApiPropertyOptional({ description: 'Task description', example: 'Use ParseUUIDPipe for id params' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'New status id', example: '22222222-2222-2222-2222-222222222222' })
  @IsOptional()
  @IsUUID()
  statusId?: string;

  @ApiPropertyOptional({ description: 'Task priority', enum: TaskPriority, example: 'MEDIUM' })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({ description: 'Task start date (ISO)', example: '2026-04-03T08:00:00.000Z' })
  @IsOptional()
  @IsDateString({}, { message: 'startDate must be a valid ISO date string' })
  startDate?: string;

  @ApiPropertyOptional({ description: 'Task due date (ISO)', example: '2026-04-06T17:00:00.000Z' })
  @IsOptional()
  @IsDateString({}, { message: 'dueDate must be a valid ISO date string' })
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Parent task id', example: '33333333-3333-3333-3333-333333333333' })
  @IsOptional()
  @IsUUID()
  parentTaskId?: string;
}

export class TaskQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by status name', example: 'IN_PROGRESS' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by task priority', enum: TaskPriority, example: 'HIGH' })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({ description: 'Search in title/description', example: 'auth' })
  @IsOptional()
  @IsString()
  search?: string;
}
