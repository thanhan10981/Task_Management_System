import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CommentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findTaskById(taskId: string) {
    return this.prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        projectId: true,
      },
    });
  }

  findCommentById(id: string) {
    return this.prisma.comment.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });
  }

  listTaskComments(taskId: string, skip: number, take: number) {
    return this.prisma.comment.findMany({
      where: { taskId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      skip,
      take,
    });
  }

  countTaskComments(taskId: string) {
    return this.prisma.comment.count({ where: { taskId } });
  }

  createComment(data: Prisma.CommentCreateInput) {
    return this.prisma.comment.create({
      data,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  updateComment(id: string, content: string) {
    return this.prisma.comment.update({
      where: { id },
      data: { content },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  deleteComment(id: string) {
    return this.prisma.comment.delete({ where: { id } });
  }

  findProjectMember(projectId: string, userId: string) {
    return this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });
  }

  createTaskHistory(data: Prisma.TaskHistoryCreateInput) {
    return this.prisma.taskHistory.create({ data });
  }

  createNotification(data: Prisma.NotificationCreateInput) {
    return this.prisma.notification.create({ data });
  }
}
