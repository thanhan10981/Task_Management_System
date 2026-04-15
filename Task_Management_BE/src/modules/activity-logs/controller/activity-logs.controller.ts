import { Controller, Get, Query, Request } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ActivityLogQueryDto } from '../dto/activity-log.dto';
import { ActivityLogsService } from '../service/activity-logs.service';

@ApiTags('Activity Logs')
@ApiCookieAuth('accessToken')
@Controller('activity-logs')
export class ActivityLogsController {
  constructor(private readonly activityLogsService: ActivityLogsService) {}

  @Get()
  @ApiOperation({ summary: 'Get activity logs (read-only)' })
  @ApiResponse({ status: 200, description: 'Activity logs fetched successfully' })
  list(@Request() req: any, @Query() queryDto: ActivityLogQueryDto) {
    return this.activityLogsService.listCurrentUserAccessible(req.user.id, queryDto);
  }
}
