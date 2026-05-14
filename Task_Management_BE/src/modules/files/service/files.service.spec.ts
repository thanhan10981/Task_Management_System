import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { FilesService } from './files.service';

describe('FilesService', () => {
  let service: FilesService;
  let prisma: any;
  let repository: any;
  let cloudinary: any;

  const fileRecord = {
    id: 'file-1',
    fileName: 'doc.pdf',
    fileUrl: 'https://cdn/doc.pdf',
    fileType: 'pdf',
    fileCategory: 'raw',
    storageKey: 'projects/project-1/tasks/doc',
    folderPath: 'tasks',
    sizeBytes: BigInt(10),
    projectId: 'project-1',
    taskId: 'task-1',
    commentId: null,
    uploadedBy: 'user-1',
    createdAt: new Date('2026-05-13T00:00:00.000Z'),
  };

  beforeEach(() => {
    prisma = {
      project: { findFirst: jest.fn().mockResolvedValue({ id: 'project-1' }) },
      task: { findFirst: jest.fn().mockResolvedValue({ id: 'task-1', projectId: 'project-1' }) },
      file: {
        findMany: jest.fn().mockResolvedValue([]),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'user-1',
          fullName: 'Ada',
          email: 'ada@example.com',
          avatarUrl: null,
        }),
      },
    };
    repository = {
      createFileMetadata: jest.fn().mockResolvedValue(fileRecord),
      findActiveFileById: jest.fn(),
      deleteFileById: jest.fn(),
    };
    cloudinary = {
      normalizePath: jest.fn((value?: string | null) => value?.trim().replace(/^\/+|\/+$/g, '') || undefined),
      resolveSupportedFileKind: jest.fn().mockReturnValue({ resourceType: 'raw', enforcedFormat: 'pdf' }),
      createSignedUploadParams: jest.fn().mockReturnValue({ folder: 'projects/project-1/tasks', timestamp: 1, signature: 'sig' }),
      getResource: jest.fn(),
      extractFileName: jest.fn().mockReturnValue('doc.pdf'),
      extractFileExtension: jest.fn().mockReturnValue('pdf'),
      resolveLogicalFolderPath: jest.fn().mockReturnValue('tasks'),
      normalizeStoredResourceType: jest.fn().mockReturnValue('raw'),
      normalizeStoredFormat: jest.fn().mockReturnValue('pdf'),
      uploadProjectTaskFile: jest.fn(),
      detectPreviewOptions: jest.fn().mockReturnValue({ canPreview: true, resourceType: 'image', format: 'png' }),
      getDefaultAuthenticatedUrlTtlSeconds: jest.fn().mockReturnValue(300),
      createPreviewUrl: jest.fn().mockResolvedValue('preview-url'),
      createDownloadUrl: jest.fn().mockResolvedValue('download-url'),
      toAllowedResourceType: jest.fn().mockReturnValue('raw'),
      resolveDownloadFormat: jest.fn().mockReturnValue('pdf'),
      resolveDownloadFileName: jest.fn().mockReturnValue('doc.pdf'),
      deleteAsset: jest.fn(),
      toScopedFolderPath: jest.fn((projectId: string, path?: string) => `projects/${projectId}/${path ?? ''}`),
      listFolders: jest.fn().mockResolvedValue([]),
      deriveDirectChildPath: jest.fn(),
      deriveDescendantPath: jest.fn(),
      createFolder: jest.fn().mockResolvedValue({ path: 'projects/project-1/docs', name: 'docs' }),
      ensureFolderPath: jest.fn((value: string) => value.trim()),
    };
    service = new FilesService(prisma, repository, cloudinary);
  });

  it('creates a signed upload after validating project and task access', async () => {
    const signature = await service.createUploadSignature('user-1', {
      projectId: 'project-1',
      taskId: 'task-1',
      fileName: 'doc.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 100,
      folderPath: '/tasks/',
    } as any);

    expect(signature).toMatchObject({
      folder: 'projects/project-1/tasks',
      signature: 'sig',
      expiresInSeconds: 600,
    });
    expect(signature.uploadId).toEqual(expect.any(String));
  });

  it('rejects invalid upload metadata and inaccessible projects', async () => {
    await expect(
      service.createUploadSignature('user-1', {
        projectId: 'project-1',
        fileName: '',
        mimeType: 'application/pdf',
        sizeBytes: 100,
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException);

    prisma.project.findFirst.mockResolvedValue(null);
    await expect(service.list('user-1', 'project-1')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('saves existing Cloudinary metadata', async () => {
    cloudinary.getResource.mockResolvedValue({
      public_id: 'projects/project-1/tasks/doc',
      secure_url: 'https://cdn/doc.pdf',
      format: 'pdf',
      resource_type: 'raw',
      bytes: 10,
    });

    await expect(
      service.create('user-1', {
        projectId: 'project-1',
        taskId: 'task-1',
        publicId: 'projects/project-1/tasks/doc',
        resourceType: 'raw',
        fileName: 'doc.pdf',
      } as any),
    ).resolves.toMatchObject({
      id: 'file-1',
      fileName: 'doc.pdf',
      publicId: 'projects/project-1/tasks/doc',
      sizeBytes: 10,
    });
  });

  it('finalizes pending signed uploads and deletes invalid pending assets', async () => {
    const signature = await service.createUploadSignature('user-1', {
      projectId: 'project-1',
      taskId: 'task-1',
      fileName: 'doc.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 100,
      folderPath: 'tasks',
    } as any);

    await expect(
      service.finalizeUpload('user-1', {
        uploadId: signature.uploadId,
        projectId: 'project-1',
        publicId: 'projects/project-1/tasks/doc',
        secureUrl: 'https://cdn/doc.pdf',
        format: 'pdf',
        resourceType: 'raw',
        bytes: 10,
      } as any),
    ).resolves.toMatchObject({ id: 'file-1', originalFilename: 'doc.pdf' });

    const invalidSignature = await service.createUploadSignature('user-1', {
      projectId: 'project-1',
      taskId: 'task-1',
      fileName: 'doc.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 100,
      folderPath: 'tasks',
    } as any);

    await expect(
      service.finalizeUpload('user-1', {
        uploadId: invalidSignature.uploadId,
        projectId: 'project-1',
        publicId: 'outside/doc',
        secureUrl: 'https://cdn/doc.pdf',
        format: 'pdf',
        resourceType: 'raw',
        bytes: 10,
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('generates secure URLs and deletes file records', async () => {
    repository.findActiveFileById.mockResolvedValue(fileRecord);

    await expect(service.getSecurePreviewUrl('user-1', 'file-1')).resolves.toMatchObject({
      previewUrl: 'preview-url',
      expiresInSeconds: 300,
    });
    await expect(service.getSecureDownloadUrl('user-1', 'file-1')).resolves.toMatchObject({
      downloadUrl: 'download-url',
      fileName: 'doc.pdf',
    });
    await expect(service.delete('user-1', 'file-1')).resolves.toEqual({
      message: 'File deleted from Cloudinary and database',
    });

    repository.findActiveFileById.mockResolvedValue(null);
    await expect(service.delete('user-1', 'missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
