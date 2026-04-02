import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  ParseUUIDPipe,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
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
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new project' })
  @ApiBody({ type: CreateProjectDto })
  create(@Request() req, @Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(req.user.id, createProjectDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get projects with pagination and filters' })
  findAll(@Request() req, @Query() queryDto: ProjectQueryDto) {
    return this.projectsService.findAll(req.user.id, queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project details by id' })
  findOne(@Request() req, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.projectsService.findOne(req.user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update project by id' })
  @ApiBody({ type: UpdateProjectDto })
  update(
    @Request() req,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectsService.update(req.user.id, id, updateProjectDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete project by id' })
  remove(@Request() req, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.projectsService.remove(req.user.id, id);
  }
}
