import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Request,
} from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminService } from './admin.service';
import {
  AdminProjectQueryDto,
  AdminSearchQueryDto,
  AdminTaskQueryDto,
  UpdateAdminProjectStatusDto,
  UpdateAdminTaskStatusDto,
  UpdateAdminUserRoleDto,
  UpdateAdminUserStatusDto,
} from './dto/admin.dto';

@ApiTags('Admin')
@ApiCookieAuth('accessToken')
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  @Get('users')
  listUsers(@Query() queryDto: AdminSearchQueryDto) {
    return this.adminService.listUsers(queryDto);
  }

  @Get('users/:id')
  getUser(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.adminService.getUser(id);
  }

  @Patch('users/:id/role')
  updateUserRole(
    @Request() req,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateAdminUserRoleDto,
  ) {
    return this.adminService.updateUserRole(req.user.id, id, dto.role);
  }

  @Patch('users/:id/status')
  updateUserStatus(
    @Request() req,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateAdminUserStatusDto,
  ) {
    return this.adminService.updateUserStatus(req.user.id, id, dto.isActive);
  }

  @Get('projects')
  listProjects(@Query() queryDto: AdminProjectQueryDto) {
    return this.adminService.listProjects(queryDto);
  }

  @Patch('projects/:id/status')
  updateProjectStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateAdminProjectStatusDto,
  ) {
    return this.adminService.updateProjectStatus(id, dto.status);
  }

  @Delete('projects/:id')
  deleteProject(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.adminService.deleteProject(id);
  }

  @Get('tasks')
  listTasks(@Query() queryDto: AdminTaskQueryDto) {
    return this.adminService.listTasks(queryDto);
  }

  @Patch('tasks/:id/status')
  updateTaskStatus(
    @Request() req,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateAdminTaskStatusDto,
  ) {
    return this.adminService.updateTaskStatus(id, dto.statusId, req.user.id);
  }

  @Delete('tasks/:id')
  deleteTask(@Request() req, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.adminService.deleteTask(id, req.user.id);
  }

  @Get('members')
  listMembers(@Query() queryDto: AdminSearchQueryDto) {
    return this.adminService.listMembers(queryDto);
  }
}
