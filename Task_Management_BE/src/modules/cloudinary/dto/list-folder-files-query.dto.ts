import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class ListFolderFilesQueryDto {
  @ApiProperty({ description: 'Folder path', example: 'tasks/attachments' })
  @IsString()
  @IsNotEmpty({ message: 'Folder path is required' })
  @MaxLength(255, { message: 'Folder path must be at most 255 characters' })
  folder: string;

  @ApiPropertyOptional({ description: 'Pagination cursor from previous response', example: '52d4ee7f5f...' })
  @IsOptional()
  @IsString()
  nextCursor?: string;

  @ApiPropertyOptional({ description: 'Max files per page', example: 30, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  maxResults?: number = 30;
}
