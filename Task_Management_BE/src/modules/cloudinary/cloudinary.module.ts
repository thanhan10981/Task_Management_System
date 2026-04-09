import { Module } from '@nestjs/common';
import { FilesModule } from '../files/files.module';
import { CloudinaryController } from './controller/cloudinary.controller';
import { CloudinaryService } from './service/cloudinary.service';

@Module({
  imports: [FilesModule],
  controllers: [CloudinaryController],
  providers: [CloudinaryService],
  exports: [CloudinaryService],
})
export class CloudinaryModule {}
