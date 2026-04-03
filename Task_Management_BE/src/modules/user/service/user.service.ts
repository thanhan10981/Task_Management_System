import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  CreateUserDto,
  UpdateUserDto,
  UserQueryDto,
} from '../dto/user.dto';
import {
  createPaginatedResponse,
  createPaginationOptions,
} from '../../../common/helpers/pagination.helper';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException({
        message: 'Validation failed',
        errors: { email: ['Email is already in use'] },
      });
    }

    const passwordHash = createUserDto.password
      ? await this.hashPassword(createUserDto.password)
      : null;

    const user = await this.prisma.user.create({
      data: {
        fullName: createUserDto.fullName,
        email: createUserDto.email,
        passwordHash,
        avatarUrl: createUserDto.avatarUrl,
        coverUrl: createUserDto.coverUrl,
        jobTitle: createUserDto.jobTitle,
        phone: createUserDto.phone,
        bio: createUserDto.bio,
      },
      include: {
        userSettings: true,
      },
    });

    return this.mapUserResponse(user);
  }

  async findAll(queryDto: UserQueryDto) {
    const { skip, take } = createPaginationOptions(queryDto);

    const where = queryDto.search
      ? {
          OR: [
            { fullName: { contains: queryDto.search, mode: 'insensitive' as const } },
            { email: { contains: queryDto.search, mode: 'insensitive' as const } },
            { phone: { contains: queryDto.search, mode: 'insensitive' as const } },
            { jobTitle: { contains: queryDto.search, mode: 'insensitive' as const } },
          ],
        }
      : undefined;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          userSettings: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take,
      }),
      this.prisma.user.count({ where }),
    ]);

    const mappedUsers = users.map((user) => this.mapUserResponse(user));
    return createPaginatedResponse(mappedUsers, total, queryDto);
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        userSettings: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.mapUserResponse(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
      const emailInUse = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });

      if (emailInUse) {
        throw new ConflictException({
          message: 'Validation failed',
          errors: { email: ['Email is already in use'] },
        });
      }
    }

    const updateData: {
      fullName?: string;
      email?: string;
      passwordHash?: string;
      avatarUrl?: string;
      coverUrl?: string;
      jobTitle?: string;
      phone?: string;
      bio?: string;
    } = {
      fullName: updateUserDto.fullName,
      email: updateUserDto.email,
      avatarUrl: updateUserDto.avatarUrl,
      coverUrl: updateUserDto.coverUrl,
      jobTitle: updateUserDto.jobTitle,
      phone: updateUserDto.phone,
      bio: updateUserDto.bio,
    };

    if (updateUserDto.password) {
      updateData.passwordHash = await this.hashPassword(updateUserDto.password);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        userSettings: true,
      },
    });

    return this.mapUserResponse(user);
  }

  async remove(id: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    const [
      createdProjects,
      projectMemberships,
      createdTasks,
      assignedTasks,
      comments,
      uploadedFiles,
      createdSprints,
    ] = await this.prisma.$transaction([
      this.prisma.project.count({ where: { createdBy: id } }),
      this.prisma.projectMember.count({ where: { userId: id } }),
      this.prisma.task.count({ where: { createdBy: id } }),
      this.prisma.taskAssignee.count({ where: { userId: id } }),
      this.prisma.comment.count({ where: { userId: id } }),
      this.prisma.file.count({ where: { uploadedBy: id } }),
      this.prisma.sprint.count({ where: { createdBy: id } }),
    ]);

    const relationUsage = {
      projectsCreated: createdProjects,
      projectMemberships,
      tasksCreated: createdTasks,
      taskAssignments: assignedTasks,
      comments,
      filesUploaded: uploadedFiles,
      sprintsCreated: createdSprints,
    };

    const hasRelatedData = Object.values(relationUsage).some((count) => count > 0);

    if (hasRelatedData) {
      throw new ConflictException({
        message: 'Cannot delete user with related data',
        relations: relationUsage,
      });
    }

    await this.prisma.user.delete({
      where: { id },
    });

    return { success: true };
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
  }

  private mapUserResponse(user: any) {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
}
