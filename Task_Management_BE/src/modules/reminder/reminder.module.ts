import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ProjectAccessModule } from '../../common/access/project-access.module';
import { MailModule } from '../../common/mail/mail.module';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { ReminderController } from './controller/reminder.controller';
import { TaskRepository } from './repository/task.repository';
import { MailService } from './service/mail.service';
import { ReminderService } from './service/reminder.service';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    ProjectAccessModule,
    ScheduleModule.forRoot(),
    MailModule,
  ],
  controllers: [ReminderController],
  providers: [TaskRepository, MailService, ReminderService],
  exports: [ReminderService],
})
export class ReminderModule {}
