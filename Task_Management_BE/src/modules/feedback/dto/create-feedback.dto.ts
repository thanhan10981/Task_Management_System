import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export enum FeedbackType {
  UI = 'ui',
  BUG = 'bug',
  FEATURE = 'feature',
  OTHER = 'other',
}

export class CreateFeedbackDto {
  @ApiProperty({ enum: FeedbackType, example: FeedbackType.BUG })
  @IsEnum(FeedbackType)
  type: FeedbackType;

  @ApiPropertyOptional({ example: 'Sidebar menu is hard to use' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  subject?: string;

  @ApiProperty({ example: 'When I hover the sidebar item, the tooltip overlaps the board.' })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(5000)
  message: string;

  @ApiPropertyOptional({ example: 'https://example.com/projects/abc/board' })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  pageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({ example: 'Task Management System' })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  projectName?: string;

  @ApiPropertyOptional({ example: 'Chrome 125 on Windows' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  clientInfo?: string;
}
