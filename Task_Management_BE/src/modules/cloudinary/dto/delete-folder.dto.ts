import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class DeleteFolderDto {
  @ApiProperty({ description: 'Folder path', example: 'tasks/attachments' })
  @IsString()
  @IsNotEmpty({ message: 'Folder path is required' })
  @MaxLength(255, { message: 'Folder path must be at most 255 characters' })
  path: string;
}
