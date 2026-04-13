import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, IsUrl, MaxLength, Min } from 'class-validator';

export class CreateFileRecordDto {
  @ApiProperty({ description: 'Original file name', example: 'specification.pdf' })
  @IsString()
  @MaxLength(255)
  fileName: string;

  @ApiProperty({ description: 'Cloudinary secure URL', example: 'https://res.cloudinary.com/demo/raw/upload/v1/task-attachments/specification.pdf' })
  @IsString()
  @IsUrl({ require_tld: false })
  secureUrl: string;

  @ApiProperty({ description: 'Cloudinary public ID', example: 'task-attachments/specification_abc123' })
  @IsString()
  @MaxLength(500)
  publicId: string;

  @ApiPropertyOptional({ description: 'File extension/format', example: 'pdf' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  format?: string;

  @ApiPropertyOptional({ description: 'Cloudinary resource type', example: 'raw' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  resourceType?: string;

  @ApiPropertyOptional({ description: 'Cloudinary folder path', example: 'task-attachments' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  folderPath?: string;

  @ApiPropertyOptional({ description: 'File size in bytes', example: 24576 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sizeBytes?: number;

  @ApiProperty({ description: 'Project ID', example: '11111111-1111-1111-1111-111111111111' })
  @IsUUID()
  projectId: string;

  @ApiPropertyOptional({ description: 'Task ID', example: '22222222-2222-2222-2222-222222222222' })
  @IsOptional()
  @IsUUID()
  taskId?: string;

  @ApiPropertyOptional({ description: 'Comment ID', example: '33333333-3333-3333-3333-333333333333' })
  @IsOptional()
  @IsUUID()
  commentId?: string;
}
