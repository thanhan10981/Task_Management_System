import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { ProjectAccessModule } from '../../common/access/project-access.module';
import { NotificationPreferencesModule } from '../../common/notifications/notification-preferences.module';
import { RedisModule } from '../../config/redis/redis.module';
import { ProjectsController } from './controller/projects.controller';
import { ProjectsService } from './service/projects.service';
import { ProjectsRepository } from './repository/projects.repository';

@Module({
  imports: [PrismaModule, ProjectAccessModule, RedisModule, NotificationPreferencesModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, ProjectsRepository],
})
export class ProjectsModule {}
