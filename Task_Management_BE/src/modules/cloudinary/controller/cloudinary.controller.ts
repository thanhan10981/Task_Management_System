import { Controller, Get, HttpStatus, Query, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../common/types/authenticated-user.type';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { FilesService } from '../../files/service/files.service';
import { ListCloudinaryQueryDto } from '../dto/list-cloudinary-query.dto';

@ApiTags('Cloudinary Explorer')
@ApiCookieAuth('accessToken')
@UseGuards(JwtAuthGuard)
@Controller('cloudinary')
export class CloudinaryController {
  constructor(private readonly filesService: FilesService) {}

  @Get('files')
  @ApiOperation({ summary: 'List files directly from Cloudinary using server secret key' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Cloudinary files fetched successfully' })
  listFiles(@CurrentUser() user: AuthenticatedUser, @Query() query: ListCloudinaryQueryDto) {
    return this.filesService.listCloudinaryResources(user.id, {
      projectId: query.projectId,
      folderPath: query.folderPath,
    });
  }

  @Get('folders')
  @ApiOperation({ summary: 'List folders directly from Cloudinary using server secret key' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Cloudinary folders fetched successfully' })
  listFolders(@CurrentUser() user: AuthenticatedUser, @Query() query: ListCloudinaryQueryDto) {
    return this.filesService.listCloudinaryFolders(user.id, query.projectId, query.parentPath);
  }
}
