import { Body, Controller, Delete, Get, HttpStatus, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreateCloudinaryFolderDto } from '../dto/create-cloudinary-folder.dto';
import { CreateFileRecordDto } from '../dto/create-file-record.dto';
import { ProjectScopedFilesQueryDto } from '../dto/project-scoped-files-query.dto';
import { FilesService } from '../service/files.service';

@ApiTags('Files')
@ApiCookieAuth('accessToken')
@UseGuards(JwtAuthGuard)
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post()
  @ApiOperation({ summary: 'Save uploaded Cloudinary metadata to database' })
  @ApiBody({ type: CreateFileRecordDto })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'File metadata saved successfully' })
  create(@Request() req, @Body() dto: CreateFileRecordDto) {
    return this.filesService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List user file metadata from database' })
  @ApiQuery({ name: 'projectId', required: true, type: String })
  @ApiQuery({ name: 'folderPath', required: false, type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'File list fetched successfully' })
  list(@Request() req, @Query() query: ProjectScopedFilesQueryDto) {
    return this.filesService.list(req.user.id, query.projectId, query.folderPath);
  }

  @Get('cloudinary/folders')
  @ApiOperation({ summary: 'List folders directly from Cloudinary Admin API' })
  @ApiQuery({ name: 'projectId', required: true, type: String })
  @ApiQuery({ name: 'parentPath', required: false, type: String })
  @ApiQuery({ name: 'recursive', required: false, type: Boolean, description: 'Return all nested subfolders' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Cloudinary folder list fetched successfully' })
  listCloudinaryFolders(
    @Request() req,
    @Query() query: ProjectScopedFilesQueryDto,
  ): Promise<unknown> {
    const recursiveFlag = query.recursive === 'true' || query.recursive === '1';
    return this.filesService.listCloudinaryFolders(req.user.id, query.projectId, query.parentPath, recursiveFlag);
  }

  @Post('cloudinary/folders')
  @ApiOperation({ summary: 'Create Cloudinary folder on backend' })
  @ApiBody({ type: CreateCloudinaryFolderDto })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Cloudinary folder created successfully' })
  createCloudinaryFolder(@Request() req, @Body() dto: CreateCloudinaryFolderDto): Promise<unknown> {
    return this.filesService.createCloudinaryFolder(req.user.id, dto);
  }

  @Get('cloudinary/resources')
  @ApiOperation({ summary: 'List files directly from Cloudinary Admin API and merge saved metadata' })
  @ApiQuery({ name: 'projectId', required: true, type: String })
  @ApiQuery({ name: 'folderPath', required: false, type: String })
  @ApiQuery({ name: 'includeDescendants', required: false, type: Boolean })
  @ApiResponse({ status: HttpStatus.OK, description: 'Cloudinary files fetched successfully' })
  listCloudinaryResources(
    @Request() req,
    @Query() query: ProjectScopedFilesQueryDto,
  ): Promise<unknown> {
    const includeDescendantsFlag = query.includeDescendants !== 'false' && query.includeDescendants !== '0';
    return this.filesService.listCloudinaryResources(req.user.id, {
      projectId: query.projectId,
      folderPath: query.folderPath,
      includeDescendants: includeDescendantsFlag,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete file in Cloudinary and mark deleted in database' })
  @ApiResponse({ status: HttpStatus.OK, description: 'File deleted successfully' })
  delete(@Request() req, @Param('id') id: string) {
    return this.filesService.delete(req.user.id, id);
  }
}
