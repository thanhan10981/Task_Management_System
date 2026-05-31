import { Body, Controller, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../common/types/authenticated-user.type';
import { CreateFeedbackDto } from '../dto/create-feedback.dto';
import { FeedbackService } from '../service/feedback.service';

@ApiTags('Feedback')
@ApiBearerAuth('accessToken')
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @ApiOperation({ summary: 'Submit UI, bug, or feature feedback by email' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Feedback email queued successfully',
  })
  submitFeedback(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateFeedbackDto,
  ) {
    return this.feedbackService.submitFeedback(user, dto);
  }
}
