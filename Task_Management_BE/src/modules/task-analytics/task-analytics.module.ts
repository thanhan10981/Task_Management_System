import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { TaskAnalyticsController } from './controller/task-analytics.controller';
import { TaskAnalyticsService } from './service/task-analytics.service';
import { TaskAnalyticsRepository } from './repository/task-analytics.repository';

@Module({
  imports: [PrismaModule],
  controllers: [TaskAnalyticsController],
  providers: [TaskAnalyticsService, TaskAnalyticsRepository],
})
export class TaskAnalyticsModule {}
