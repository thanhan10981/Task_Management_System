import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  CommentQueryDto,
  CreateCommentDto,
  UpdateCommentDto,
} from '../dto/comment.dto';
import { CommentsService } from '../service/comments.service';

@ApiTags('Comments')
@ApiCookieAuth('accessToken')
@UseGuards(JwtAuthGuard)
@Controller('tasks/:taskId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  @ApiOperation({ summary: 'List comments by task' })
  @ApiResponse({ status: 200, description: 'Comments fetched successfully' })
  listByTask(
    @Request() req: any,
    @Param('taskId', new ParseUUIDPipe()) taskId: string,
    @Query() queryDto: CommentQueryDto,
  ) {
    return this.commentsService.listByTask(req.user.id, taskId, queryDto);
  }

  @Post()
  @ApiOperation({ summary: 'Create comment for a task' })
  @ApiResponse({ status: 201, description: 'Comment created successfully' })
  create(
    @Request() req: any,
    @Param('taskId', new ParseUUIDPipe()) taskId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(req.user.id, taskId, dto);
  }

  @Patch(':commentId')
  @ApiOperation({ summary: 'Update own comment' })
  @ApiResponse({ status: 200, description: 'Comment updated successfully' })
  update(
    @Request() req: any,
    @Param('commentId', new ParseUUIDPipe()) commentId: string,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.commentsService.update(req.user.id, commentId, dto);
  }

  @Delete(':commentId')
  @ApiOperation({ summary: 'Delete comment (owner or project admin/owner)' })
  @ApiResponse({ status: 200, description: 'Comment deleted successfully' })
  remove(@Request() req: any, @Param('commentId', new ParseUUIDPipe()) commentId: string) {
    return this.commentsService.remove(req.user.id, commentId);
  }
}
