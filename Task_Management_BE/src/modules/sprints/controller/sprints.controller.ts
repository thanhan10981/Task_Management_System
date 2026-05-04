import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
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
import { CreateSprintDto, SprintQueryDto, UpdateSprintDto } from '../dto/sprint.dto';
import { SprintsService } from '../service/sprints.service';

@ApiTags('Sprints')
@ApiCookieAuth('accessToken')
@Controller('sprints')
export class SprintsController {
  constructor(private readonly sprintsService: SprintsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a sprint' })
  @ApiBody({ type: CreateSprintDto })
  @ApiResponse({ status: 201, description: 'Sprint created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request body' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'No access to target project' })
  create(@Request() req, @Body() createSprintDto: CreateSprintDto) {
    return this.sprintsService.create(req.user.id, createSprintDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get sprints with pagination and optional filters' })
  @ApiResponse({ status: 200, description: 'Sprints fetched successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@Request() req, @Query() queryDto: SprintQueryDto) {
    return this.sprintsService.findAll(req.user.id, queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get sprint details by id' })
  @ApiResponse({ status: 200, description: 'Sprint fetched successfully' })
  @ApiResponse({ status: 400, description: 'Invalid sprint id' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'No access to target project' })
  @ApiResponse({ status: 404, description: 'Sprint not found' })
  findOne(@Request() req, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.sprintsService.findOne(req.user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update sprint by id' })
  @ApiBody({ type: UpdateSprintDto })
  @ApiResponse({ status: 200, description: 'Sprint updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request body or sprint id' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'No access to target project' })
  @ApiResponse({ status: 404, description: 'Sprint not found' })
  update(
    @Request() req,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateSprintDto: UpdateSprintDto,
  ) {
    return this.sprintsService.update(req.user.id, id, updateSprintDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete sprint by id' })
  @ApiResponse({ status: 200, description: 'Sprint deleted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid sprint id' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Only project owner can delete sprint' })
  @ApiResponse({ status: 404, description: 'Sprint not found' })
  remove(@Request() req, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.sprintsService.remove(req.user.id, id);
  }
}
