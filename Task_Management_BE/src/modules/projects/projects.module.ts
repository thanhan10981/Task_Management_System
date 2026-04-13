import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { ProjectAccessModule } from '../../common/access/project-access.module';
import { ProjectsController } from './controller/projects.controller';
import { ProjectsService } from './service/projects.service';
import { ProjectsRepository } from './repository/projects.repository';

@Module({
  imports: [PrismaModule, ProjectAccessModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, ProjectsRepository],
})
export class ProjectsModule {}
