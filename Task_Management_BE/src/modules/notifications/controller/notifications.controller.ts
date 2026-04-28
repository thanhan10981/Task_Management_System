import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Request,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { NotificationQueryDto } from '../dto/notification.dto';
import { NotificationsService } from '../service/notifications.service';

@ApiTags('Notifications')
@ApiCookieAuth('accessToken')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List current user notifications' })
  @ApiResponse({ status: 200, description: 'Notifications fetched successfully' })
  list(@Request() req: any, @Query() queryDto: NotificationQueryDto) {
    return this.notificationsService.listForCurrentUser(req.user.id, queryDto);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark one notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  markAsRead(@Request() req: any, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.notificationsService.markAsRead(req.user.id, id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  markAllAsRead(@Request() req: any) {
    return this.notificationsService.markAllAsRead(req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiResponse({ status: 200, description: 'Notification deleted successfully' })
  remove(@Request() req: any, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.notificationsService.remove(req.user.id, id);
  }
}
