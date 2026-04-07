import {
	BadRequestException,
	ConflictException,
	ForbiddenException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { Prisma, SprintStatus } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
	createPaginatedResponse,
	createPaginationOptions,
} from '../../../common/helpers/pagination.helper';
import { CreateSprintDto, SprintQueryDto, UpdateSprintDto } from '../dto/sprint.dto';

@Injectable()
export class SprintsService {
	constructor(private readonly prisma: PrismaService) {}

	async create(userId: string, createSprintDto: CreateSprintDto) {
		await this.ensureProjectAccess(userId, createSprintDto.projectId);

		const startDate = this.normalizeNullableDateInput(createSprintDto.startDate);
		const endDate = this.normalizeNullableDateInput(createSprintDto.endDate);
		const completedAt = this.normalizeNullableDateInput(createSprintDto.completedAt);
		const status = createSprintDto.status ?? SprintStatus.PLANNING;

		this.validateSprintBusinessRules({
			startDate,
			endDate,
			completedAt,
			status,
		});

		try {
			return await this.prisma.sprint.create({
				data: {
					projectId: createSprintDto.projectId,
					name: createSprintDto.name,
					goal: createSprintDto.goal,
					description: createSprintDto.description,
					status,
					startDate,
					endDate,
					completedAt,
					createdBy: userId,
				},
				include: {
					project: true,
					creator: true,
					_count: { select: { tasks: true } },
				},
			});
		} catch (error) {
			this.handleUniqueConstraintError(error);
			throw error;
		}
	}

	async findAll(userId: string, queryDto: SprintQueryDto) {
		const { skip, take } = createPaginationOptions(queryDto);

		const where: any = {
			projectId: queryDto.projectId,
			status: queryDto.status,
			project: {
				OR: [{ createdBy: userId }, { members: { some: { userId } } }],
			},
		};

		const [sprints, total] = await Promise.all([
			this.prisma.sprint.findMany({
				where,
				include: {
					project: true,
					creator: true,
					_count: { select: { tasks: true } },
				},
				orderBy: { createdAt: 'desc' },
				skip,
				take,
			}),
			this.prisma.sprint.count({ where }),
		]);

		return createPaginatedResponse(sprints, total, queryDto);
	}

	async findOne(userId: string, id: string) {
		const sprint = await this.prisma.sprint.findFirst({
			where: {
				id,
				project: {
					OR: [{ createdBy: userId }, { members: { some: { userId } } }],
				},
			},
			include: {
				project: true,
				creator: true,
				tasks: true,
				_count: { select: { tasks: true } },
			},
		});

		if (!sprint) {
			throw new NotFoundException('Sprint not found');
		}

		return sprint;
	}

	async update(userId: string, id: string, updateSprintDto: UpdateSprintDto) {
		const existingSprint = await this.prisma.sprint.findUnique({
			where: { id },
			select: {
				id: true,
				projectId: true,
				name: true,
				status: true,
				startDate: true,
				endDate: true,
				completedAt: true,
			},
		});

		if (!existingSprint) {
			throw new NotFoundException('Sprint not found');
		}

		await this.ensureProjectAccess(userId, existingSprint.projectId);

		const startDate = this.normalizeOptionalDateInput(updateSprintDto.startDate);
		const endDate = this.normalizeOptionalDateInput(updateSprintDto.endDate);
		const completedAt = this.normalizeOptionalDateInput(updateSprintDto.completedAt);

		const nextStartDate = startDate === undefined ? existingSprint.startDate : startDate;
		const nextEndDate = endDate === undefined ? existingSprint.endDate : endDate;
		const nextCompletedAt =
			completedAt === undefined ? existingSprint.completedAt : completedAt;
		const nextStatus = updateSprintDto.status ?? existingSprint.status;

		this.validateSprintBusinessRules({
			startDate: nextStartDate,
			endDate: nextEndDate,
			completedAt: nextCompletedAt,
			status: nextStatus,
		});


		try {
			return await this.prisma.sprint.update({
				where: { id },
				data: {
					name: updateSprintDto.name,
					goal: updateSprintDto.goal,
					description: updateSprintDto.description,
					status: updateSprintDto.status,
					startDate,
					endDate,
					completedAt,
				},
				include: {
					project: true,
					creator: true,
					tasks: true,
					_count: { select: { tasks: true } },
				},
			});
		} catch (error) {
			this.handleUniqueConstraintError(error);
			throw error;
		}
	}

	async remove(userId: string, id: string) {
		const existingSprint = await this.prisma.sprint.findUnique({
			where: { id },
			select: { id: true, projectId: true },
		});

		if (!existingSprint) {
			throw new NotFoundException('Sprint not found');
		}

		await this.ensureProjectOwnership(userId, existingSprint.projectId);

		await this.prisma.sprint.delete({
			where: { id },
		});

		return { success: true };
	}
// check if user has access to the project (owner or member)
	private async ensureProjectAccess(userId: string, projectId: string) {
		const project = await this.prisma.project.findFirst({
			where: {
				id: projectId,
				OR: [{ createdBy: userId }, { members: { some: { userId } } }],
			},
			select: { id: true },
		});

		if (!project) {
			throw new ForbiddenException('You do not have access to this project');
		}
	}

	private async ensureProjectOwnership(userId: string, projectId: string) {
		const project = await this.prisma.project.findUnique({
			where: { id: projectId },
			select: { id: true, createdBy: true },
		});

		if (!project) {
			throw new NotFoundException('Project not found');
		}

		if (project.createdBy !== userId) {
			throw new ForbiddenException('Only project owner can delete this sprint');
		}
	}
// check if error is unique constraint violation and throw user-friendly message
	private handleUniqueConstraintError(error: unknown) {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code === 'P2002'
		) {
			throw new ConflictException({
				message: 'Validation failed',
				errors: { name: ['Sprint name already exists in this project'] },
			});
		}
	}

	private normalizeNullableDateInput(value?: string | null): Date | null {
		if (!value) {
			return null;
		}

		return new Date(value);
	}

	private normalizeOptionalDateInput(value?: string | null): Date | null | undefined {
		if (value === undefined) {
			return undefined;
		}

		if (!value) {
			return null;
		}

		return new Date(value);
	}

	private validateSprintBusinessRules({
		startDate,
		endDate,
		completedAt,
		status,
	}: {
		startDate: Date | null;
		endDate: Date | null;
		completedAt: Date | null;
		status: SprintStatus;
	}) {
		if (startDate && endDate && startDate > endDate) {
			throw new BadRequestException('Start date must be before end date');
		}

		if (status === 'COMPLETED' && !completedAt) {
			throw new BadRequestException('completedAt is required when status is COMPLETED');
		}
	}
}
