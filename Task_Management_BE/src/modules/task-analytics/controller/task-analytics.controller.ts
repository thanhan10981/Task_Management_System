import {
  Controller,
  Get,
  HttpStatus,
  Query,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TaskChartQueryDto } from '../dto/task-chart-query.dto';
import { TaskReportQueryDto } from '../dto/task-report-query.dto';
import { TaskAnalyticsService } from '../service/task-analytics.service';

@ApiTags('Task Analytics')
@ApiBearerAuth('accessToken')
@Controller('task-analytics')
export class TaskAnalyticsController {
  constructor(private readonly taskAnalyticsService: TaskAnalyticsService) {}

  @Get('chart')
  @ApiOperation({
    summary:
      'Get task chart data. Optionally filter by a specific project and/or month.',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['daily', 'weekly', 'monthly'],
    description: 'Chart filter period',
  })
  @ApiQuery({
    name: 'projectId',
    required: false,
    type: String,
    description: 'Filter chart data to a specific project ID',
  })
  @ApiQuery({
    name: 'month',
    required: false,
    type: String,
    description: 'Target month in YYYY-MM format (used for daily/weekly views)',
    example: '2026-04',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Task chart data retrieved successfully',
  })
  getTaskChart(@Request() req, @Query() queryDto: TaskChartQueryDto) {
    return this.taskAnalyticsService.getTaskChart(req.user.id, queryDto);
  }

  @Get('report')
  @ApiOperation({
    summary:
      'Get report data for Reports & Analytics. Optionally filter by project and sprint.',
  })
  @ApiQuery({
    name: 'projectId',
    required: false,
    type: String,
    description: 'Filter report data to a specific project ID',
  })
  @ApiQuery({
    name: 'sprintId',
    required: false,
    type: String,
    description: 'Filter report data to a specific sprint ID',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['daily', 'weekly', 'monthly'],
    description: 'Completion chart period',
  })
  @ApiQuery({
    name: 'month',
    required: false,
    type: String,
    description: 'Target month in YYYY-MM format',
    example: '2026-05',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Report data retrieved successfully',
  })
  getTaskReport(@Request() req, @Query() queryDto: TaskReportQueryDto) {
    return this.taskAnalyticsService.getTaskReport(req.user.id, queryDto);
  }
}
