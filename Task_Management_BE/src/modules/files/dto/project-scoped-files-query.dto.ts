import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBooleanString, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class ProjectScopedFilesQueryDto {
  @ApiProperty({ description: 'Project ID', example: '11111111-1111-1111-1111-111111111111' })
  @IsUUID()
  projectId: string;

  @ApiPropertyOptional({ description: 'Cloudinary folder path', example: 'tasks/attachments' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  folderPath?: string;

  @ApiPropertyOptional({ description: 'Task ID attached to file', example: '22222222-2222-2222-2222-222222222222' })
  @IsOptional()
  @IsUUID()
  taskId?: string;

  @ApiPropertyOptional({ description: 'Parent folder path', example: 'tasks' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  parentPath?: string;

  @ApiPropertyOptional({ description: 'Include descendants', example: 'true' })
  @IsOptional()
  @IsBooleanString()
  includeDescendants?: string;

  @ApiPropertyOptional({ description: 'Recursive folder listing', example: 'true' })
  @IsOptional()
  @IsBooleanString()
  recursive?: string;
}
