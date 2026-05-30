import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { ProjectAccessModule } from '../../common/access/project-access.module';
import { MailModule } from '../../common/mail/mail.module';
import { NotificationPreferencesModule } from '../../common/notifications/notification-preferences.module';
import { TasksController } from './controller/tasks.controller';
import { ProjectTasksController } from './controller/project-tasks.controller';
import { TasksRepository } from './repository/tasks.repository';
import { AiTaskService } from './service/ai-task.service';
import { TaskService } from './service/task.service';
import { TaskAssigneeService } from './service/task-assignee.service';
import { TaskAssignmentMailService } from './service/task-assignment-mail.service';
import { TaskStatusService } from './service/task-status.service';

@Module({
  imports: [PrismaModule, ProjectAccessModule, NotificationPreferencesModule, MailModule],
  controllers: [TasksController, ProjectTasksController],
  providers: [
    TasksRepository,
    AiTaskService,
    TaskService,
    TaskAssigneeService,
    TaskAssignmentMailService,
    TaskStatusService,
  ],
})
export class TasksModule {}
