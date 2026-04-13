import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { ProjectAccessModule } from '../../common/access/project-access.module';
import { TasksController } from './controller/tasks.controller';
import { TasksRepository } from './repository/tasks.repository';
import { TaskService } from './service/task.service';
import { TaskAssigneeService } from './service/task-assignee.service';
import { TaskStatusService } from './service/task-status.service';

@Module({
  imports: [PrismaModule, ProjectAccessModule],
  controllers: [TasksController],
  providers: [
    TasksRepository,
    TaskService,
    TaskAssigneeService,
    TaskStatusService,
  ],
})
export class TasksModule {}
