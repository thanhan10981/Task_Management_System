import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  Query,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import {
  AssignTaskUserDto,
  CreateTaskDto,
  TaskQueryDto,
  UpdateTaskDto,
} from '../dto/task.dto';
import {
  CreateTaskStatusDto,
  UpdateTaskStatusDto,
} from '../dto/task-status.dto';
import { TaskService } from '../service/task.service';
import { TaskAssigneeService } from '../service/task-assignee.service';
import { TaskStatusService } from '../service/task-status.service';

@ApiTags('Tasks')
@ApiBearerAuth('accessToken')
@Controller('tasks')
export class TasksController {
  // Service split keeps task domain maintainable as complexity grows.
  constructor(
    private readonly taskService: TaskService,
    private readonly taskAssigneeService: TaskAssigneeService,
    private readonly taskStatusService: TaskStatusService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Task created successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  create(@Request() req, @Body() createTaskDto: CreateTaskDto) {
    return this.taskService.create(req.user.id, createTaskDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get tasks with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'status', required: false, type: String, example: 'TODO' })
  @ApiQuery({ name: 'priority', required: false, type: String, example: 'HIGH' })
  @ApiQuery({ name: 'search', required: false, type: String, example: 'api integration' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Tasks retrieved successfully' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  findAll(@Request() req, @Query() queryDto: TaskQueryDto) {
    return this.taskService.findAll(req.user.id, queryDto);
  }

  @Get('parent/:parentTaskId')
  @ApiOperation({ summary: 'Get tasks by parent task ID' })
  @ApiParam({
    name: 'parentTaskId',
    type: String,
    format: 'uuid',
    description: 'Parent task ID',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'status', required: false, type: String, example: 'TODO' })
  @ApiQuery({ name: 'priority', required: false, type: String, example: 'HIGH' })
  @ApiQuery({ name: 'search', required: false, type: String, example: 'api integration' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Child tasks retrieved successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid parent task id' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  findByParentTask(
    @Request() req,
    @Param('parentTaskId', new ParseUUIDPipe()) parentTaskId: string,
    @Query() queryDto: TaskQueryDto,
  ) {
    return this.taskService.findByParentTask(req.user.id, parentTaskId, queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task by ID' })
  @ApiParam({ name: 'id', type: String, format: 'uuid', description: 'Task ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Task retrieved successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Task not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  findOne(@Request() req, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.taskService.findOne(req.user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update task by ID' })
  @ApiParam({ name: 'id', type: String, format: 'uuid', description: 'Task ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Task updated successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Task not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  update(
    @Request() req,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.taskService.update(req.user.id, id, updateTaskDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete task by ID' })
  @ApiParam({ name: 'id', type: String, format: 'uuid', description: 'Task ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Task deleted successfully' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Cannot delete task with related data' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Task not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  remove(@Request() req, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.taskService.remove(req.user.id, id);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get task history (read-only audit log)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Task history retrieved successfully' })
  getHistory(
    @Request() req,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query() queryDto: TaskQueryDto,
  ) {
    return this.taskService.getHistory(req.user.id, id, queryDto);
  }

  @Get(':id/assignees')
  @ApiOperation({ summary: 'List task assignees' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Task assignees retrieved successfully' })
  listAssignees(@Request() req, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.taskAssigneeService.listAssignees(req.user.id, id);
  }

  @Post(':id/assignees')
  @ApiOperation({ summary: 'Assign user to task' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Task assignee created successfully' })
  assignUser(
    @Request() req,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() assignTaskUserDto: AssignTaskUserDto,
  ) {
    return this.taskAssigneeService.assignUser(req.user.id, id, assignTaskUserDto);
  }

  @Delete(':id/assignees/:userId')
  @ApiOperation({ summary: 'Unassign user from task' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Task assignee removed successfully' })
  unassignUser(
    @Request() req,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('userId', new ParseUUIDPipe()) userId: string,
  ) {
    return this.taskAssigneeService.unassignUser(req.user.id, id, userId);
  }

  @Get('/projects/:projectId/statuses')
  @ApiOperation({ summary: 'List task statuses by project' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Task statuses retrieved successfully' })
  listStatuses(
    @Request() req,
    @Param('projectId', new ParseUUIDPipe()) projectId: string,
  ) {
    return this.taskStatusService.listStatuses(req.user.id, projectId);
  }

  @Post('/projects/:projectId/statuses')
  @ApiOperation({ summary: 'Create task status in project' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Task status created successfully' })
  createStatus(
    @Request() req,
    @Param('projectId', new ParseUUIDPipe()) projectId: string,
    @Body() createTaskStatusDto: CreateTaskStatusDto,
  ) {
    return this.taskStatusService.createStatus(
      req.user.id,
      projectId,
      createTaskStatusDto,
    );
  }

  @Patch('/projects/:projectId/statuses/:statusId')
  @ApiOperation({ summary: 'Update task status in project' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Task status updated successfully' })
  updateStatus(
    @Request() req,
    @Param('projectId', new ParseUUIDPipe()) projectId: string,
    @Param('statusId', new ParseUUIDPipe()) statusId: string,
    @Body() updateTaskStatusDto: UpdateTaskStatusDto,
  ) {
    return this.taskStatusService.updateStatus(
      req.user.id,
      projectId,
      statusId,
      updateTaskStatusDto,
    );
  }

  @Delete('/projects/:projectId/statuses/:statusId')
  @ApiOperation({ summary: 'Delete task status in project' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Task status deleted successfully' })
  removeStatus(
    @Request() req,
    @Param('projectId', new ParseUUIDPipe()) projectId: string,
    @Param('statusId', new ParseUUIDPipe()) statusId: string,
  ) {
    return this.taskStatusService.removeStatus(req.user.id, projectId, statusId);
  }
}
