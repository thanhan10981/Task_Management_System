import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ProjectAccessService } from '../../../common/access/project-access.service';
import {
  CreateTaskStatusDto,
  UpdateTaskStatusDto,
} from '../dto/task-status.dto';
import { TasksRepository } from '../repository/tasks.repository';

@Injectable()
export class TaskStatusService {
  constructor(
    private readonly tasksRepository: TasksRepository,
    private readonly projectAccessService: ProjectAccessService,
  ) {}

  async listStatuses(userId: string, projectId: string) {
    await this.projectAccessService.ensureProjectMember(userId, projectId);
    return this.tasksRepository.listProjectStatuses(projectId);
  }

  async createStatus(userId: string, projectId: string, dto: CreateTaskStatusDto) {
    await this.projectAccessService.ensureProjectAdminOrOwner(userId, projectId);

    let createdStatus;
    try {
      createdStatus = await this.tasksRepository.createTaskStatus({
        project: { connect: { id: projectId } },
        name: dto.name,
        color: dto.color,
        position: dto.position,
        isDefault: dto.isDefault || false,
        isDone: dto.isDone || false,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Status name or position already exists in this project',
        );
      }

      throw error;
    }

    return createdStatus;
  }

  async updateStatus(
    userId: string,
    projectId: string,
    statusId: string,
    dto: UpdateTaskStatusDto,
  ) {
    await this.projectAccessService.ensureProjectAdminOrOwner(userId, projectId);

    const existingStatus = await this.tasksRepository.findStatusById(statusId);

    if (!existingStatus || existingStatus.projectId !== projectId) {
      throw new NotFoundException('Task status not found');
    }

    if (dto.position && dto.position !== existingStatus.position) {
      await this.tasksRepository.reorderStatuses(projectId, statusId, dto.position);
    }

    let updatedStatus;
    try {
      updatedStatus = await this.tasksRepository.updateTaskStatus(statusId, {
        name: dto.name,
        color: dto.color,
        isDefault: dto.isDefault,
        isDone: dto.isDone,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Status name or position already exists in this project',
        );
      }

      throw error;
    }

    return updatedStatus;
  }

  async removeStatus(userId: string, projectId: string, statusId: string) {
    await this.projectAccessService.ensureProjectAdminOrOwner(userId, projectId);

    const status = await this.tasksRepository.findStatusById(statusId);

    if (!status || status.projectId !== projectId) {
      throw new NotFoundException('Task status not found');
    }

    const usedCount = await this.tasksRepository.countTasksByStatus(statusId);
    if (usedCount > 0) {
      throw new ConflictException('Cannot delete status that is used by tasks');
    }

    await this.tasksRepository.deleteTaskStatus(statusId);

    return { success: true };
  }
}
