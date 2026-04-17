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
import { TaskAnalyticsService } from '../service/task-analytics.service';

@ApiTags('Task Analytics')
@ApiBearerAuth('accessToken')
@Controller('task-analytics')
export class TaskAnalyticsController {
  constructor(private readonly taskAnalyticsService: TaskAnalyticsService) {}

  @Get('chart')
  @ApiOperation({
    summary:
      'Get task chart data for projects the current user created or joined',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['daily', 'weekly', 'monthly'],
    description: 'Chart filter period',
  })
  @ApiResponse({
    description: 'Task chart data retrieved successfully',
  })
  getTaskChart(@Request() req, @Query() queryDto: TaskChartQueryDto) {
    return this.taskAnalyticsService.getTaskChart(req.user.id, queryDto);
  }
}
