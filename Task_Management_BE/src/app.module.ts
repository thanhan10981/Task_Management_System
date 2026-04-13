import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './config/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { SprintsModule } from './modules/sprints/sprints.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { UserModule } from './modules/user/user.module';
import { FilesModule } from './modules/files/files.module';
import { ReminderModule } from './modules/reminder/reminder.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { UserSettingsModule } from './modules/user-settings/user-settings.module';
import { CommentsModule } from './modules/comments/comments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ActivityLogsModule } from './modules/activity-logs/activity-logs.module';

import configuration from './config/configuration';
import { validate } from './config/validation.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate,
    }),
    DatabaseModule,
    AuthModule,
    ProjectsModule,
    SprintsModule,
    TasksModule,
    UserModule,
    FilesModule,
    ReminderModule,
    UserSettingsModule,
    CommentsModule,
    NotificationsModule,
    ActivityLogsModule,
  ],
  controllers: [AppController],
  providers: [AppService, LoggingInterceptor, ResponseInterceptor],
})
export class AppModule {}
