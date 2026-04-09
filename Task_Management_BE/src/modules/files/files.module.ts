import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { FilesController } from './controller/files.controller';
import { CloudinaryAdminService } from './service/cloudinary-admin.service';
import { FilesService } from './service/files.service';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [FilesController],
  providers: [FilesService, CloudinaryAdminService],
  exports: [FilesService],
})
export class FilesModule {}
