import { Transform } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum CloudinaryResourceType {
  IMAGE = 'image',
  VIDEO = 'video',
  RAW = 'raw',
  AUTO = 'auto',
}

export class UploadFileDto {
  @ApiPropertyOptional({ description: 'Target folder path', example: 'tasks/attachments' })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Folder must be at most 255 characters' })
  folder?: string;

  @ApiPropertyOptional({ description: 'Custom public id', example: 'tasks/attachments/task-123-report' })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Public ID must be at most 255 characters' })
  publicId?: string;

  @ApiPropertyOptional({ enum: CloudinaryResourceType, example: CloudinaryResourceType.AUTO })
  @IsOptional()
  @IsEnum(CloudinaryResourceType)
  resourceType?: CloudinaryResourceType;

  @ApiPropertyOptional({ description: 'Overwrite file if public ID already exists', example: false })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    return value === true || value === 'true';
  })
  @IsBoolean()
  overwrite?: boolean;

  @ApiPropertyOptional({ description: 'Comma-separated tags', example: 'task,attachment,report' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    if (Array.isArray(value)) {
      return value
        .map((tag) => (typeof tag === 'string' ? tag.trim() : tag))
        .filter((tag): tag is string => typeof tag === 'string' && tag.length > 0);
    }

    if (typeof value === 'string') {
      return value
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);
    }

    return value;
  })
  @IsArray()
  @ArrayMaxSize(50, { message: 'Tags must be at most 50 items' })
  @IsString({ each: true })
  @MaxLength(50, { each: true, message: 'Each tag must be at most 50 characters' })
  tags?: string[];
}
