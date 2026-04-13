import { Module } from '@nestjs/common';
import { ProjectAccessModule } from '../../common/access/project-access.module';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { ActivityLogsController } from './controller/activity-logs.controller';
import { ActivityLogsRepository } from './repository/activity-logs.repository';
import { ActivityLogsService } from './service/activity-logs.service';

@Module({
  imports: [PrismaModule, ProjectAccessModule],
  controllers: [ActivityLogsController],
  providers: [ActivityLogsService, ActivityLogsRepository],
})
export class ActivityLogsModule {}
