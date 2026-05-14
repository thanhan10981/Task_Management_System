import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskPriority } from '@prisma/client';

export class GenerateTaskDraftDto {
  @ApiProperty({ example: 'Build a sprint burndown chart for project dashboards' })
  @IsString()
  @IsNotEmpty({ message: 'Prompt is required' })
  @MaxLength(4000, { message: 'Prompt must be at most 4000 characters' })
  prompt: string;
}

export class AiSuggestedSubtaskDto {
  @ApiProperty({ example: 'Add backend aggregation endpoint' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ example: 'Return daily completed and remaining task counts.' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class AiTaskDraftDto {
  @ApiProperty({ example: 'Build sprint burndown chart' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({ example: 'Create a chart showing sprint progress over time.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'Users can inspect remaining work by day for the selected sprint.' })
  @IsString()
  @IsNotEmpty()
  behavior: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(3)
  @ArrayMaxSize(7)
  @IsString({ each: true })
  acceptanceCriteria: string[];

  @ApiProperty({ enum: ['LOW', 'MEDIUM', 'HIGH'] })
  @IsEnum(TaskPriority)
  priority: TaskPriority;

  @ApiProperty({ type: [AiSuggestedSubtaskDto] })
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(6)
  @ValidateNested({ each: true })
  @Type(() => AiSuggestedSubtaskDto)
  suggestedSubtasks: AiSuggestedSubtaskDto[];
}

export class GenerateTaskDescriptionDto {
  @ApiProperty({ example: 'Create task management dashboard' })
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  @MaxLength(255, { message: 'Title must be at most 255 characters' })
  title: string;

  @ApiPropertyOptional({ example: 'Current task notes and context.' })
  @IsOptional()
  @IsString()
  @MaxLength(8000, { message: 'Description must be at most 8000 characters' })
  description?: string;
}
