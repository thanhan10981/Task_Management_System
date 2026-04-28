import {
  Body,
  Controller,
  Get,
  Patch,
  Request,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UpdateUserSettingsDto } from '../dto/user-settings.dto';
import { UserSettingsService } from '../service/user-settings.service';

@ApiTags('User Settings')
@ApiCookieAuth('accessToken')
@Controller('user-settings')
export class UserSettingsController {
  constructor(private readonly userSettingsService: UserSettingsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user settings' })
  @ApiResponse({ status: 200, description: 'User settings fetched successfully' })
  getCurrent(@Request() req: any) {
    return this.userSettingsService.getCurrentSettings(req.user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user settings' })
  @ApiResponse({ status: 200, description: 'User settings updated successfully' })
  updateCurrent(@Request() req: any, @Body() dto: UpdateUserSettingsDto) {
    return this.userSettingsService.updateCurrentSettings(req.user.id, dto);
  }
}
