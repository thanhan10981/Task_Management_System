import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export class CreateUploadSignatureDto {
  @ApiProperty({ description: 'Project ID', example: '11111111-1111-1111-1111-111111111111' })
  @IsUUID()
  projectId: string;

  @ApiPropertyOptional({ description: 'Task ID', example: '22222222-2222-2222-2222-222222222222' })
  @IsOptional()
  @IsUUID()
  taskId?: string;

  @ApiPropertyOptional({ description: 'Comment ID to associate this file with', example: '33333333-3333-3333-3333-333333333333' })
  @IsOptional()
  @IsUUID()
  commentId?: string;

  @ApiPropertyOptional({ description: 'Logical folder path inside project root', example: 'tasks/upload' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  folderPath?: string;

  @ApiProperty({ description: 'Original file name', example: 'specification.pdf' })
  @IsString()
  @MaxLength(255)
  fileName: string;

  @ApiProperty({ description: 'File MIME type', example: 'application/pdf' })
  @IsString()
  @MaxLength(150)
  mimeType: string;

  @ApiProperty({ description: 'File size in bytes', example: 24576 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20 * 1024 * 1024)
  sizeBytes: number;
}
