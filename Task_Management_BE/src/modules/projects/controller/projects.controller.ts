import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  ParseUUIDPipe,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  AddProjectMemberDto,
  CreateProjectDto,
  ProjectQueryDto,
  UpdateProjectDto,
  UpdateProjectMemberRoleDto,
} from '../dto/project.dto';
import { ProjectsService } from '../service/projects.service';

@ApiTags('Projects')
@ApiCookieAuth('accessToken')
@Controller('projects')
export class ProjectsController {
  // Project member APIs intentionally live inside project routes,
  // so there is no standalone project-members CRUD controller.
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  @ApiBody({ type: CreateProjectDto })
  @ApiResponse({ status: 201, description: 'Project created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request body' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@Request() req, @Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(req.user.id, createProjectDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get projects with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Projects fetched successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@Request() req, @Query() queryDto: ProjectQueryDto) {
    return this.projectsService.findAll(req.user.id, queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project details by id' })
  @ApiResponse({ status: 200, description: 'Project fetched successfully' })
  @ApiResponse({ status: 400, description: 'Invalid project id' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  findOne(@Request() req, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.projectsService.findOne(req.user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update project by id' })
  @ApiBody({ type: UpdateProjectDto })
  @ApiResponse({ status: 200, description: 'Project updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request body or project id' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Only project owner can update project' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  update(
    @Request() req,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectsService.update(req.user.id, id, updateProjectDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete project by id' })
  @ApiResponse({ status: 200, description: 'Project deleted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid project id' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Only project owner can delete project' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  remove(@Request() req, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.projectsService.remove(req.user.id, id);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'List project members' })
  @ApiResponse({ status: 200, description: 'Project members fetched successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  listMembers(@Request() req, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.projectsService.listMembers(req.user.id, id);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add member to project (owner/admin only)' })
  @ApiBody({ type: AddProjectMemberDto })
  @ApiResponse({ status: 201, description: 'Project member added successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  addMember(
    @Request() req,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() addProjectMemberDto: AddProjectMemberDto,
  ) {
    return this.projectsService.addMember(req.user.id, id, addProjectMemberDto);
  }

  @Patch(':id/members/:memberUserId/role')
  @ApiOperation({ summary: 'Update project member role (owner/admin only)' })
  @ApiBody({ type: UpdateProjectMemberRoleDto })
  @ApiResponse({ status: 200, description: 'Project member role updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Project or member not found' })
  updateMemberRole(
    @Request() req,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('memberUserId', new ParseUUIDPipe()) memberUserId: string,
    @Body() updateProjectMemberRoleDto: UpdateProjectMemberRoleDto,
  ) {
    return this.projectsService.updateMemberRole(
      req.user.id,
      id,
      memberUserId,
      updateProjectMemberRoleDto,
    );
  }

  @Delete(':id/members/:memberUserId')
  @ApiOperation({ summary: 'Remove member from project (owner/admin only)' })
  @ApiResponse({ status: 200, description: 'Project member removed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Project or member not found' })
  removeMember(
    @Request() req,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('memberUserId', new ParseUUIDPipe()) memberUserId: string,
  ) {
    return this.projectsService.removeMember(req.user.id, id, memberUserId);
  }
}
