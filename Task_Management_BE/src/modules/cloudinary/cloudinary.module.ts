import { Module } from '@nestjs/common';
import { FilesModule } from '../files/files.module';
import { CloudinaryController } from './controller/cloudinary.controller';

@Module({
  imports: [FilesModule],
  controllers: [CloudinaryController],
})
export class CloudinaryModule {}
