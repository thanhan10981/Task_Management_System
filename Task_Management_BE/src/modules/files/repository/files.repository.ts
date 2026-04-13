import { InternalServerErrorException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';

export const FILE_SELECT = Prisma.validator<Prisma.FileSelect>()({
  id: true,
  fileName: true,
  fileUrl: true,
  storageKey: true,
  fileType: true,
  fileCategory: true,
  folderPath: true,
  sizeBytes: true,
  projectId: true,
  taskId: true,
  uploadedBy: true,
  isDeleted: true,
  createdAt: true,
});

type FileRecord = Prisma.FileGetPayload<{
  select: typeof FILE_SELECT;
}>;

export type SerializedFileRecord = Omit<FileRecord, 'sizeBytes'> & {
  sizeBytes: string | null;
};

export interface CreateFileMetadataPayload {
  fileName: string;
  fileUrl: string;
  fileType?: string;
  fileCategory?: string;
  storageKey: string;
  folderPath?: string;
  sizeBytes?: bigint;
  projectId: string;
  taskId?: string;
  commentId?: string;
  uploadedBy: string;
}

function serializeFileRecord(file: FileRecord): SerializedFileRecord {
  return {
    ...file,
    sizeBytes: file.sizeBytes ? file.sizeBytes.toString() : null,
  };
}

@Injectable()
export class FilesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createFileMetadata(input: CreateFileMetadataPayload): Promise<SerializedFileRecord> {
    try {
      const file = await this.prisma.file.create({
        data: input,
        select: FILE_SELECT,
      });

      return serializeFileRecord(file);
    } catch {
      throw new InternalServerErrorException('Failed to create file metadata');
    }
  }

  async findActiveFileById(fileId: string, userId: string): Promise<SerializedFileRecord | null> {
    try {
      const file = await this.prisma.file.findUnique({
        where: { id: fileId },
        select: FILE_SELECT,
      });

      if (!file || file.isDeleted || file.uploadedBy !== userId) {
        return null;
      }

      return serializeFileRecord(file);
    } catch {
      throw new InternalServerErrorException('Failed to fetch file metadata');
    }
  }

  async deleteFileById(fileId: string, userId: string): Promise<void> {
    try {
      const result = await this.prisma.file.updateMany({
        where: {
          id: fileId,
          uploadedBy: userId,
          isDeleted: false,
        },
        data: {
          isDeleted: true,
        },
      });

      if (result.count === 0) {
        throw new NotFoundException('File not found');
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to delete file metadata');
    }
  }
}
