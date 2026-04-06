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
  UseInterceptors,
} from '@nestjs/common';
import {
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
import { CloudinaryService } from './cloudinary.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { DeleteFolderDto } from './dto/delete-folder.dto';
import { ListFolderFilesQueryDto } from './dto/list-folder-files-query.dto';
import { RenameFolderDto } from './dto/rename-folder.dto';
import { UploadFileDto } from './dto/upload-file.dto';

interface UploadedMemoryFile {
  buffer: Buffer;
}

@ApiTags('Cloudinary')
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
        fileSize: 20 * 1024 * 1024,
      },
    }),
  )
  uploadFile(
    @UploadedFile() file: UploadedMemoryFile,
    @Body() dto: UploadFileDto,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    return this.cloudinaryService.uploadFile(file, dto);
  }

  @Delete('files/:publicId')
  @ApiOperation({ summary: 'Delete file by public ID' })
  @ApiParam({ name: 'publicId', description: 'Cloudinary public ID', example: 'tasks/attachments/task-1' })
  @ApiResponse({ status: HttpStatus.OK, description: 'File deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'File not found' })
  deleteFile(@Param('publicId') publicId: string) {
    return this.cloudinaryService.deleteFile(decodeURIComponent(publicId));
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
  createFolder(@Body() dto: CreateFolderDto) {
    return this.cloudinaryService.createFolder(dto);
  }

  @Patch('folders/rename')
  @ApiOperation({ summary: 'Rename folder' })
  @ApiBody({ type: RenameFolderDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Folder renamed successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid folder path' })
  renameFolder(@Body() dto: RenameFolderDto) {
    return this.cloudinaryService.renameFolder(dto);
  }

  @Delete('folders')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete empty folder' })
  @ApiBody({ type: DeleteFolderDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Folder deleted successfully' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Folder is not empty' })
  deleteFolder(@Body() dto: DeleteFolderDto) {
    return this.cloudinaryService.deleteFolder(dto);
  }

  @Get('folders/files')
  @ApiOperation({ summary: 'List files by folder' })
  @ApiQuery({ name: 'folder', required: true, type: String, example: 'tasks/attachments' })
  @ApiQuery({ name: 'maxResults', required: false, type: Number, example: 30 })
  @ApiQuery({ name: 'nextCursor', required: false, type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'Files fetched successfully' })
  listFolderFiles(@Query() query: ListFolderFilesQueryDto) {
    return this.cloudinaryService.listFolderFiles(query);
  }

  @Delete('folders/recursive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete folder recursively' })
  @ApiBody({ type: DeleteFolderDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Folder deleted recursively' })
  deleteFolderRecursive(@Body() dto: DeleteFolderDto) {
    return this.cloudinaryService.deleteFolderRecursive(dto);
  }
}
