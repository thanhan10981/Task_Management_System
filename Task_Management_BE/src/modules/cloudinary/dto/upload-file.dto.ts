import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
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
  @IsString()
  @MaxLength(500, { message: 'Tags must be at most 500 characters' })
  tags?: string;
}
