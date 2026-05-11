import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateProjectTaskDto } from '../dto/task.dto';
import { GenerateTaskDraftDto } from '../dto/ai-task.dto';
import { AiTaskService } from '../service/ai-task.service';
import { TaskService } from '../service/task.service';

@ApiTags('Project Tasks')
@ApiBearerAuth('accessToken')
@Controller('projects/:projectId')
export class ProjectTasksController {
  constructor(
    private readonly aiTaskService: AiTaskService,
    private readonly taskService: TaskService,
  ) {}

  @Post('ai/generate-task')
  @ApiOperation({ summary: 'Generate an AI task draft from natural language' })
  generateTaskDraft(
    @Request() req,
    @Param('projectId', new ParseUUIDPipe()) projectId: string,
    @Body() dto: GenerateTaskDraftDto,
  ) {
    return this.aiTaskService.generateTaskDraft(req.user.id, projectId, dto.prompt);
  }

  @Post('tasks')
  @ApiOperation({ summary: 'Create a task in a project' })
  createProjectTask(
    @Request() req,
    @Param('projectId', new ParseUUIDPipe()) projectId: string,
    @Body() createTaskDto: CreateProjectTaskDto,
  ) {
    return this.taskService.create(req.user.id, {
      ...createTaskDto,
      projectId,
    });
  }
}
