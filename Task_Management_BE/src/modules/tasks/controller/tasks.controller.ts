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

@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Request() req, @Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create(req.user.id, createTaskDto);
  }

  @Get()
  findAll(@Request() req, @Query() queryDto: TaskQueryDto) {
    return this.tasksService.findAll(req.user.id, queryDto);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.tasksService.findOne(req.user.id, id);
  }

  @Patch(':id')
  update(
    @Request() req,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.tasksService.update(req.user.id, id, updateTaskDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.tasksService.remove(req.user.id, id);
  }
}
