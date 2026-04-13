import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ProjectAccessService } from '../../../common/access/project-access.service';
import {
  createPaginatedResponse,
  createPaginationOptions,
} from '../../../common/helpers/pagination.helper';
import { ActivityLogQueryDto } from '../dto/activity-log.dto';
import { ActivityLogsRepository } from '../repository/activity-logs.repository';

@Injectable()
export class ActivityLogsService {
  constructor(
    private readonly activityLogsRepository: ActivityLogsRepository,
    private readonly projectAccessService: ProjectAccessService,
  ) {}

  async listCurrentUserAccessible(userId: string, queryDto: ActivityLogQueryDto) {
    // Activity log API is read-only by design; write operations are side effects only.
    const { skip, take } = createPaginationOptions(queryDto);

    const where: Prisma.ActivityLogWhereInput = {
      OR: [
        { userId },
        {
          project: {
            OR: [
              { createdBy: userId },
              {
                members: {
                  some: {
                    userId,
                  },
                },
              },
            ],
          },
        },
      ],
    };

    if (queryDto.entityType) {
      where.entityType = queryDto.entityType;
    }

    if (queryDto.projectId) {
      await this.projectAccessService.ensureProjectMember(userId, queryDto.projectId);
      where.projectId = queryDto.projectId;
    }

    const [logs, total] = await Promise.all([
      this.activityLogsRepository.list(where, skip, take),
      this.activityLogsRepository.count(where),
    ]);

    return createPaginatedResponse(logs, total, queryDto);
  }
}
