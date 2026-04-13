import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateCloudinaryFolderDto {
  @ApiProperty({ description: 'Project ID', example: '11111111-1111-1111-1111-111111111111' })
  @IsUUID()
  projectId: string;

  @ApiProperty({ description: 'Cloudinary folder path', example: 'tasks/attachments/design' })
  @IsString()
  @MaxLength(255)
  path: string;
}