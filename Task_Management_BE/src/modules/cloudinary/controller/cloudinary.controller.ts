import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CloudinaryService } from '../service/cloudinary.service';
import { CreateFolderDto } from '../dto/create-folder.dto';
import { DeleteFolderDto } from '../dto/delete-folder.dto';
import { ListFolderFilesQueryDto } from '../dto/list-folder-files-query.dto';
import { RenameFolderDto } from '../dto/rename-folder.dto';
import { UploadFileDto } from '../dto/upload-file.dto';
import { NormalizePathFieldsPipe } from '../pipes/normalize-path-fields.pipe';
import { NormalizePathPipe } from '../pipes/normalize-path.pipe';
import { UploadedMemoryFile } from '../types/cloudinary.types';

const ALLOWED_UPLOAD_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'application/pdf',
  'text/plain',
]);

@ApiTags('Cloudinary')
@ApiCookieAuth('accessToken')
@UseGuards(JwtAuthGuard)
@Controller('cloudinary')
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post('files/upload')
  @ApiOperation({ summary: 'Upload file to Cloudinary' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        folder: { type: 'string' },
        publicId: { type: 'string' },
        resourceType: { type: 'string', enum: ['image', 'video', 'raw', 'auto'] },
        overwrite: { type: 'boolean' },
        tags: { type: 'string' },
      },
      required: ['file'],
    },
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'File uploaded successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 20 * 1024 * 1024, //20MB
      },
      fileFilter: (_req, file, callback) => {
        if (!ALLOWED_UPLOAD_MIME_TYPES.has(file.mimetype)) {
          return callback(
            new BadRequestException('Unsupported file type. Allowed: images, mp4/webm videos, pdf, txt'),
            false,
          );
        }

        return callback(null, true);
      },
    }),
  )
  uploadFile(
    @UploadedFile() file: UploadedMemoryFile,
    @Body(new NormalizePathFieldsPipe(['folder', 'publicId'])) dto: UploadFileDto,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    return this.cloudinaryService.uploadFile(file, dto);
  }

  @Delete('files/:publicId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete file by public ID' })
  @ApiParam({ name: 'publicId', description: 'Cloudinary public ID', example: 'tasks/attachments/task-1' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'File deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'File not found' })
  deleteFile(@Param('publicId', NormalizePathPipe) publicId: string) {
    return this.cloudinaryService.deleteFile(publicId);
  }

  @Get('folders')
  @ApiOperation({ summary: 'List root folders' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Folders fetched successfully' })
  listFolders() {
    return this.cloudinaryService.listFolders();
  }

  @Post('folders')
  @ApiOperation({ summary: 'Create folder' })
  @ApiBody({ type: CreateFolderDto })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Folder created successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid folder path' })
  createFolder(@Body(new NormalizePathFieldsPipe(['path'])) dto: CreateFolderDto) {
    return this.cloudinaryService.createFolder(dto);
  }

  @Patch('folders/rename')
  @ApiOperation({ summary: 'Rename folder' })
  @ApiBody({ type: RenameFolderDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Folder renamed successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid folder path' })
  renameFolder(@Body(new NormalizePathFieldsPipe(['fromPath', 'toPath'])) dto: RenameFolderDto) {
    return this.cloudinaryService.renameFolder(dto);
  }

  @Delete('folders')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete empty folder' })
  @ApiBody({ type: DeleteFolderDto })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Folder deleted successfully' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Folder is not empty' })
  deleteFolder(@Body(new NormalizePathFieldsPipe(['path'])) dto: DeleteFolderDto) {
    return this.cloudinaryService.deleteFolder(dto);
  }

  @Get('folders/files')
  @ApiOperation({ summary: 'List files by folder' })
  @ApiQuery({ name: 'folder', required: true, type: String, example: 'tasks/attachments' })
  @ApiQuery({ name: 'maxResults', required: false, type: Number, example: 30 })
  @ApiQuery({ name: 'nextCursor', required: false, type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'Files fetched successfully' })
  listFolderFiles(@Query(new NormalizePathFieldsPipe(['folder'])) query: ListFolderFilesQueryDto) {
    return this.cloudinaryService.listFolderFiles(query);
  }

  @Delete('folders/recursive')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete folder recursively' })
  @ApiBody({ type: DeleteFolderDto })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Folder deleted recursively' })
  deleteFolderRecursive(@Body(new NormalizePathFieldsPipe(['path'])) dto: DeleteFolderDto) {
    return this.cloudinaryService.deleteFolderRecursive(dto);
  }
}
