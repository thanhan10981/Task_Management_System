import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { FilesController } from './controller/files.controller';

import { CloudinaryFolderService } from './service/cloudinary-folder.service';
import { CloudinaryResourceService } from './service/cloudinary-resource.service';
import { FilesService } from './service/files.service';
import { CloudinaryAdminService } from './service/cloudinary-admin.service';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [FilesController],
  providers: [FilesService, CloudinaryAdminService, CloudinaryFolderService, CloudinaryResourceService],
  exports: [FilesService],
})
export class FilesModule {}
