import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateTaskStatusDto {
  @ApiProperty({ description: 'Status name', example: 'In Review' })
  @IsString()
  @IsNotEmpty({ message: 'Status name is required' })
  @MaxLength(100, { message: 'Status name must be at most 100 characters' })
  name: string;

  @ApiPropertyOptional({ description: 'Status color', example: '#3B82F6' })
  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'Color must be at most 20 characters' })
  color?: string;

  @ApiProperty({ description: 'Status position in board', example: 1 })
  @Min(1)
  position: number;

  @ApiPropertyOptional({ description: 'Whether this status is default', example: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ description: 'Whether this status means done', example: false })
  @IsOptional()
  @IsBoolean()
  isDone?: boolean;
}

export class UpdateTaskStatusDto {
  @ApiPropertyOptional({ description: 'Status name', example: 'Completed' })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Status name must be at most 100 characters' })
  name?: string;

  @ApiPropertyOptional({ description: 'Status color', example: '#10B981' })
  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'Color must be at most 20 characters' })
  color?: string;

  @ApiPropertyOptional({ description: 'Status position in board', example: 3 })
  @IsOptional()
  @Min(1)
  position?: number;

  @ApiPropertyOptional({ description: 'Whether this status is default', example: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ description: 'Whether this status means done', example: true })
  @IsOptional()
  @IsBoolean()
  isDone?: boolean;
}
