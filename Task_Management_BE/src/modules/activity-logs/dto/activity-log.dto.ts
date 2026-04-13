import { ApiPropertyOptional } from '@nestjs/swagger';
import { ActivityType } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

export class ActivityLogQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: ActivityType })
  @IsOptional()
  @IsEnum(ActivityType)
  entityType?: ActivityType;

  @ApiPropertyOptional({ description: 'Filter by project id' })
  @IsOptional()
  @IsUUID()
  projectId?: string;
}
