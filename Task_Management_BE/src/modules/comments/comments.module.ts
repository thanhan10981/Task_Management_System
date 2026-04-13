import { Module } from '@nestjs/common';
import { ProjectAccessModule } from '../../common/access/project-access.module';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { CommentsController } from './controller/comments.controller';
import { CommentsRepository } from './repository/comments.repository';
import { CommentsService } from './service/comments.service';

@Module({
  imports: [PrismaModule, ProjectAccessModule],
  controllers: [CommentsController],
  providers: [CommentsService, CommentsRepository],
})
export class CommentsModule {}
