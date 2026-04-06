import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { ScheduleModule } from '@nestjs/schedule';
import { buildMailFrom } from '../../common/helpers/mail-from.helper';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { TaskRepository } from './repository/task.repository';
import { MailService } from './service/mail.service';
import { ReminderService } from './service/reminder.service';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    ScheduleModule.forRoot(),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const host = configService.get<string>('SMTP_HOST');
        const user = configService.get<string>('SMTP_USER');
        const pass = configService.get<string>('SMTP_PASS');
        const port = Number(configService.get<string>('SMTP_PORT') ?? 587);
        const fromAddress = buildMailFrom(
          configService.get<string>('MAIL_PUBLIC_FROM_NAME'),
          configService.get<string>('MAIL_PUBLIC_FROM_ADDRESS'),
        );

        if (!host || !user || !pass) {
          return {
            transport: {
              jsonTransport: true,
            },
            defaults: {
              from: fromAddress,
            },
          };
        }

        return {
          transport: {
            host,
            port,
            secure: port === 465,
            auth: {
              user,
              pass,
            },
          },
          defaults: {
            from: fromAddress,
          },
        };
      },
    }),
  ],
  providers: [TaskRepository, MailService, ReminderService],
  exports: [ReminderService],
})
export class ReminderModule {}
