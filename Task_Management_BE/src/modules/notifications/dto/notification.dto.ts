import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { NotificationType } from '@prisma/client';

export class NotificationQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: NotificationType })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;
}
