import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, IsUrl, MaxLength, Min } from 'class-validator';

export class CreateFileMetadataDto {
  @ApiProperty({ description: 'File name', example: 'specification.pdf' })
  @IsString()
  @MaxLength(255)
  fileName: string;

  @ApiProperty({ description: 'Public URL of uploaded file', example: 'https://res.cloudinary.com/demo/file/upload/v1/specification.pdf' })
  @IsString()
  @IsUrl({ require_tld: false })
  fileUrl: string;

  @ApiPropertyOptional({ description: 'File MIME/extension type', example: 'pdf' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fileType?: string;

  @ApiPropertyOptional({ description: 'File category', example: 'raw' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  fileCategory?: string;

  @ApiPropertyOptional({ description: 'Cloudinary storage key (publicId)', example: 'task-attachments/specification_abc123' })
  @IsOptional()
  @IsString()
  storageKey?: string;

  @ApiPropertyOptional({ description: 'Cloudinary folder path', example: 'task-attachments' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  folderPath?: string;

  @ApiPropertyOptional({ description: 'Thumbnail URL', example: 'https://res.cloudinary.com/demo/image/upload/v1/specification-thumb.jpg' })
  @IsOptional()
  @IsString()
  @IsUrl({ require_tld: false })
  thumbnailUrl?: string;

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
