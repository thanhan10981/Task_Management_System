import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RenameFolderDto {
  @ApiProperty({ description: 'Current folder path', example: 'tasks/attachments' })
  @IsString()
  @IsNotEmpty({ message: 'fromPath is required' })
  @MaxLength(255, { message: 'fromPath must be at most 255 characters' })
  fromPath: string;

  @ApiProperty({ description: 'New folder path', example: 'tasks/files' })
  @IsString()
  @IsNotEmpty({ message: 'toPath is required' })
  @MaxLength(255, { message: 'toPath must be at most 255 characters' })
  toPath: string;
}
