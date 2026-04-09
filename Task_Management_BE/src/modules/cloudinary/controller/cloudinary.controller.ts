import { Controller, Get, HttpStatus, ParseUUIDPipe, Query, Request, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CloudinaryService } from '../service/cloudinary.service';

@ApiTags('Cloudinary Explorer')
@ApiCookieAuth('accessToken')
@UseGuards(JwtAuthGuard)
@Controller('cloudinary')
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Get('files')
  @ApiOperation({ summary: 'List files directly from Cloudinary using server secret key' })
  @ApiQuery({ name: 'projectId', required: true, type: String })
  @ApiQuery({ name: 'folderPath', required: false, type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'Cloudinary files fetched successfully' })
  listFiles(@Request() req, @Query('projectId', new ParseUUIDPipe()) projectId: string, @Query('folderPath') folderPath?: string) {
    return this.cloudinaryService.listFiles(req.user.id, projectId, folderPath);
  }

  @Get('folders')
  @ApiOperation({ summary: 'List folders directly from Cloudinary using server secret key' })
  @ApiQuery({ name: 'projectId', required: true, type: String })
  @ApiQuery({ name: 'parentPath', required: false, type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'Cloudinary folders fetched successfully' })
  listFolders(@Request() req, @Query('projectId', new ParseUUIDPipe()) projectId: string, @Query('parentPath') parentPath?: string) {
    return this.cloudinaryService.listFolders(req.user.id, projectId, parentPath);
  }
}
