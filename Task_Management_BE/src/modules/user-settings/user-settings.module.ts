import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { UserSettingsController } from './controller/user-settings.controller';
import { UserSettingsRepository } from './repository/user-settings.repository';
import { UserSettingsService } from './service/user-settings.service';

@Module({
  imports: [PrismaModule],
  controllers: [UserSettingsController],
  providers: [UserSettingsService, UserSettingsRepository],
})
export class UserSettingsModule {}
