import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ example: 'Need to update acceptance criteria for this ticket.' })
  @IsString()
  @IsNotEmpty({ message: 'Content is required' })
  content: string;

  @ApiPropertyOptional({ example: '67a8d68f-bf4d-46df-b46e-012dd94324c4' })
  @IsOptional()
  @IsUUID()
  parentCommentId?: string;
}

export class UpdateCommentDto {
  @ApiProperty({ example: 'Updated comment content' })
  @IsString()
  @IsNotEmpty({ message: 'Content is required' })
  content: string;
}

export class CommentQueryDto extends PaginationDto {}
