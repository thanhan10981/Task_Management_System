import { BadRequestException } from '@nestjs/common';
import { FilesController } from './files.controller';

describe('FilesController', () => {
  let controller: FilesController;
  let service: any;
  const req = { user: { id: 'user-1' } };

  beforeEach(() => {
    service = {
      create: jest.fn(),
      createUploadSignature: jest.fn(),
      finalizeUpload: jest.fn(),
      uploadProjectFile: jest.fn(),
      list: jest.fn(),
      listCloudinaryFolders: jest.fn(),
      createCloudinaryFolder: jest.fn(),
      listCloudinaryResources: jest.fn(),
      delete: jest.fn(),
      getSecurePreviewUrl: jest.fn(),
      getSecureDownloadUrl: jest.fn(),
    };
    controller = new FilesController(service);
  });

  it('forwards file commands with current user id', () => {
    controller.create(req, { publicId: 'p' } as any);
    controller.createUploadSignature(req, { fileName: 'a.pdf' } as any);
    controller.finalizeUpload(req, { uploadId: 'u' } as any);
    controller.list(req, { projectId: 'project-1', folderPath: 'docs', taskId: 'task-1' } as any);
    controller.createCloudinaryFolder(req, { projectId: 'project-1', path: 'docs' } as any);
    controller.delete(req, 'file-1');
    controller.view(req, 'file-1');
    controller.download(req, 'file-1');

    expect(service.create).toHaveBeenCalledWith('user-1', { publicId: 'p' });
    expect(service.createUploadSignature).toHaveBeenCalledWith('user-1', { fileName: 'a.pdf' });
    expect(service.finalizeUpload).toHaveBeenCalledWith('user-1', { uploadId: 'u' });
    expect(service.list).toHaveBeenCalledWith('user-1', 'project-1', 'docs', 'task-1');
    expect(service.createCloudinaryFolder).toHaveBeenCalledWith('user-1', { projectId: 'project-1', path: 'docs' });
    expect(service.delete).toHaveBeenCalledWith('user-1', 'file-1');
    expect(service.getSecurePreviewUrl).toHaveBeenCalledWith('user-1', 'file-1');
    expect(service.getSecureDownloadUrl).toHaveBeenCalledWith('user-1', 'file-1');
  });

  it('normalizes upload filename and parses cloudinary query flags', () => {
    const file = { originalname: ' doc.pdf ', buffer: Buffer.from('x'), mimetype: 'application/pdf' };

    controller.upload(req, { projectId: 'project-1' } as any, file);
    expect(service.uploadProjectFile).toHaveBeenCalledWith(
      'user-1',
      { projectId: 'project-1' },
      expect.objectContaining({ originalname: 'doc.pdf' }),
    );

    controller.listCloudinaryFolders(req, { projectId: 'project-1', parentPath: 'docs', recursive: '1' } as any);
    expect(service.listCloudinaryFolders).toHaveBeenCalledWith('user-1', 'project-1', 'docs', true);

    controller.listCloudinaryResources(req, { projectId: 'project-1', folderPath: 'docs', includeDescendants: '0' } as any);
    expect(service.listCloudinaryResources).toHaveBeenCalledWith('user-1', {
      projectId: 'project-1',
      folderPath: 'docs',
      includeDescendants: false,
    });
  });

  it('requires a multipart file for direct upload', () => {
    expect(() => controller.upload(req, { projectId: 'project-1' } as any, undefined as any)).toThrow(
      BadRequestException,
    );
  });
});
