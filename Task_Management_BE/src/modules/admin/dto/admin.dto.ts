import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ProjectStatus, TaskPriority, UserRole } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class AdminSearchQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;
}

export class AdminProjectQueryDto extends AdminSearchQueryDto {
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;
}

export class AdminTaskQueryDto extends AdminSearchQueryDto {
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsUUID()
  statusId?: string;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;
}

export class UpdateAdminUserRoleDto {
  @IsEnum(UserRole)
  role: UserRole;
}

export class UpdateAdminUserStatusDto {
  @IsBoolean()
  isActive: boolean;
}

export class UpdateAdminProjectStatusDto {
  @IsEnum(ProjectStatus)
  status: ProjectStatus;
}

export class UpdateAdminTaskStatusDto {
  @IsUUID()
  statusId: string;
}
