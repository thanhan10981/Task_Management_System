import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { NotificationsController } from './controller/notifications.controller';
import { NotificationsRepository } from './repository/notifications.repository';
import { NotificationsService } from './service/notifications.service';

@Module({
  imports: [PrismaModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsRepository],
})
export class NotificationsModule {}
