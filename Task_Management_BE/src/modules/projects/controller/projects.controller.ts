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
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  CreateProjectDto,
  ProjectQueryDto,
  UpdateProjectDto,
} from '../dto/project.dto';
import { ProjectsService } from '../service/projects.service';

@ApiTags('Projects')
@ApiCookieAuth('accessToken')
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
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
}
