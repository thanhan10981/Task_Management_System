import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class ListCloudinaryQueryDto {
  @ApiProperty({ description: 'Project ID', format: 'uuid' })
  @IsUUID()
  projectId: string;

  @ApiPropertyOptional({ description: 'Filter files by folder path' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  folderPath?: string;

  @ApiPropertyOptional({ description: 'Filter folders by parent path' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  parentPath?: string;
}
