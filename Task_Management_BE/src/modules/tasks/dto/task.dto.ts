import {
  ArrayUnique,
  IsArray,
  IsBooleanString,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskPriority } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto';

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

  @ApiPropertyOptional({
    description: 'Task metadata such as label display data',
    example: { label: 'Design', labelBg: '#dbeafe', labelColor: '#2563eb' },
  })
  @IsOptional()
  @IsObject()
  tags?: Record<string, unknown>;

  @ApiProperty({ description: 'Project id', example: '11111111-1111-1111-1111-111111111111' })
  @IsNotEmpty({ message: 'Project ID is required' })
  @IsUUID()
  projectId: string;

  @ApiProperty({ description: 'Status id', example: '22222222-2222-2222-2222-222222222222' })
  @IsNotEmpty({ message: 'Status ID is required' })
  @IsUUID()
  statusId: string;

  @ApiPropertyOptional({ description: 'Task group id', example: '33333333-3333-3333-3333-333333333333' })
  @IsOptional()
  @IsUUID()
  groupId?: string;

  @ApiPropertyOptional({ description: 'Sprint id', example: '55555555-5555-5555-5555-555555555555' })
  @IsOptional()
  @IsUUID()
  sprintId?: string;

  @ApiPropertyOptional({ description: 'Parent task id', example: '33333333-3333-3333-3333-333333333333' })
  @IsOptional()
  @IsUUID()
  parentTaskId?: string;

  @ApiPropertyOptional({
    description: 'Assignee user ids. If omitted, creator is assigned automatically.',
    type: [String],
    example: ['44444444-4444-4444-4444-444444444444'],
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('all', { each: true })
  assigneeIds?: string[];
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

  @ApiPropertyOptional({ description: 'Task group id', example: '33333333-3333-3333-3333-333333333333' })
  @IsOptional()
  @IsUUID()
  groupId?: string | null;

  @ApiPropertyOptional({ description: 'Sprint id', example: '55555555-5555-5555-5555-555555555555' })
  @IsOptional()
  @IsUUID()
  sprintId?: string | null;

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

  @ApiPropertyOptional({
    description: 'Task metadata such as label display data',
    example: { label: 'Design', labelBg: '#dbeafe', labelColor: '#2563eb' },
  })
  @IsOptional()
  @IsObject()
  tags?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Parent task id', example: '33333333-3333-3333-3333-333333333333' })
  @IsOptional()
  @IsUUID()
  parentTaskId?: string;

  @ApiPropertyOptional({
    description: 'User IDs to add as assignees during update',
    type: [String],
    example: ['44444444-4444-4444-4444-444444444444'],
  })
  @IsOptional()
  @IsArray({ message: 'assigneeIds must be an array of UUID strings' })
  @IsUUID(4, { each: true, message: 'Each assignee id must be a valid UUID' })
  assigneeIds?: string[];
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

  @ApiPropertyOptional({ description: 'Filter by project id', example: '11111111-1111-1111-1111-111111111111' })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({ description: 'Filter by task group id', example: '33333333-3333-3333-3333-333333333333' })
  @IsOptional()
  @IsUUID()
  groupId?: string;

  @ApiPropertyOptional({ description: 'Return deleted tasks only', example: 'true' })
  @IsOptional()
  @IsBooleanString()
  deleted?: string;
}

export class CreateTaskGroupDto {
  @ApiProperty({ description: 'Task group name', example: 'Development' })
  @IsString()
  @IsNotEmpty({ message: 'Group name is required' })
  @MaxLength(120, { message: 'Group name must be at most 120 characters' })
  name: string;

  @ApiPropertyOptional({ description: 'Task group color', example: '#6366f1' })
  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'Color must be at most 20 characters' })
  color?: string;
}

export class AssignTaskUserDto {
  @ApiProperty({ description: 'User id to assign', example: '0b8390cb-83ce-4f67-a843-b422f8bc7087' })
  @IsNotEmpty({ message: 'User id is required' })
  @IsUUID()
  userId: string;
}
