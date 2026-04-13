import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UploadProjectFileDto {
  @ApiProperty({ description: 'Project ID', example: '11111111-1111-1111-1111-111111111111' })
  @IsUUID()
  projectId: string;

  @ApiPropertyOptional({ description: 'Task ID', example: '22222222-2222-2222-2222-222222222222' })
  @IsOptional()
  @IsUUID()
  taskId?: string;

  @ApiPropertyOptional({ description: 'Logical folder path inside project root', example: 'attachments' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  folderPath?: string;
}
