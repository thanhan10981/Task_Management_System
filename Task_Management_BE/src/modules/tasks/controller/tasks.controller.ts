import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { TasksService } from '../service/tasks.service';
import { CreateTaskDto, UpdateTaskDto, TaskQueryDto } from '../dto/task.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ApiBody, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Tasks')
@ApiCookieAuth('accessToken')
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  @ApiBody({ type: CreateTaskDto })
  create(@Request() req, @Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create(req.user.id, createTaskDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get tasks with query filters and pagination' })
  findAll(@Request() req, @Query() queryDto: TaskQueryDto) {
    return this.tasksService.findAll(req.user.id, queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task details by id' })
  findOne(@Request() req, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.tasksService.findOne(req.user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update task by id' })
  @ApiBody({ type: UpdateTaskDto })
  update(
    @Request() req,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.tasksService.update(req.user.id, id, updateTaskDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete task by id' })
  remove(@Request() req, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.tasksService.remove(req.user.id, id);
  }
}
