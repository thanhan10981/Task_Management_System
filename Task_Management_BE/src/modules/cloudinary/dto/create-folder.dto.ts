import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateFolderDto {
  @ApiProperty({ description: 'Folder path to create', example: 'tasks/attachments' })
  @IsString()
  @IsNotEmpty({ message: 'Folder path is required' })
  @MaxLength(255, { message: 'Folder path must be at most 255 characters' })
  path: string;
}
