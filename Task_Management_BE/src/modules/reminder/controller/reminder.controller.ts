import {
  Body,
  Controller,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TriggerTaskReminderDto } from '../dto/trigger-task-reminder.dto';
import { ReminderService } from '../service/reminder.service';

@ApiTags('Reminders')
@ApiBearerAuth('accessToken')
@Controller('reminders')
export class ReminderController {
  constructor(private readonly reminderService: ReminderService) {}

  @Post('tasks/:taskId/send')
  @ApiOperation({ summary: 'Send task deadline reminder emails immediately' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Task reminder emails queued successfully',
  })
  sendTaskReminderNow(
    @Request() req: any,
    @Param('taskId', new ParseUUIDPipe()) taskId: string,
    @Body() dto: TriggerTaskReminderDto,
  ) {
    return this.reminderService.sendTaskReminderNow(
      req.user.id,
      taskId,
      dto.thresholdMinutes,
    );
  }
}
