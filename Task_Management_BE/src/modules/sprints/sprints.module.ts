import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { SprintsController } from './controller/sprints.controller';
import { SprintsService } from './service/sprints.service';

@Module({
  imports: [PrismaModule],
  controllers: [SprintsController],
  providers: [SprintsService],
})
export class SprintsModule {}
