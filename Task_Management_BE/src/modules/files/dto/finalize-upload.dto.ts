import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, IsUrl, MaxLength, Min } from 'class-validator';

export class FinalizeUploadDto {
  @ApiProperty({ description: 'Pending upload ID returned by the signature endpoint' })
  @IsUUID()
  uploadId: string;

  @ApiProperty({ description: 'Project ID', example: '11111111-1111-1111-1111-111111111111' })
  @IsUUID()
  projectId: string;

  @ApiProperty({ description: 'Cloudinary public ID', example: 'projects/project-id/tasks/upload/file_abc123' })
  @IsString()
  @MaxLength(500)
  publicId: string;

  @ApiProperty({ description: 'Cloudinary secure URL', example: 'https://res.cloudinary.com/demo/image/upload/...' })
  @IsString()
  @IsUrl({ require_tld: false })
  secureUrl: string;

  @ApiPropertyOptional({ description: 'Original file name', example: 'specification.pdf' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  originalFilename?: string;

  @ApiPropertyOptional({ description: 'Cloudinary format', example: 'pdf' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  format?: string;

  @ApiPropertyOptional({ description: 'Cloudinary resource type', example: 'image' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  resourceType?: string;

  @ApiPropertyOptional({ description: 'Cloudinary folder path', example: 'projects/project-id/tasks/upload' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  folder?: string;

  @ApiPropertyOptional({ description: 'File size in bytes', example: 24576 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  bytes?: number;
}
