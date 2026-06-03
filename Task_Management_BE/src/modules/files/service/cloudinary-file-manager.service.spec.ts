import { CloudinaryFileManagerService } from './cloudinary-file-manager.service';

describe('CloudinaryFileManagerService', () => {
  let service: CloudinaryFileManagerService;

  beforeEach(() => {
    service = new CloudinaryFileManagerService({} as any, {} as any);
  });

  it('reports stored PDF files as raw documents instead of images', () => {
    expect(service.normalizeStoredResourceType('image', 'design.pdf', 'pdf')).toBe('raw');
    expect(service.normalizeStoredResourceType(null, 'design.pdf', null)).toBe('raw');
  });

  it('previews legacy PDFs from image storage with an image resource URL', () => {
    expect(service.detectPreviewOptions('legacy.pdf', 'pdf', 'image', 'projects/demo/legacy')).toEqual({
      canPreview: true,
      resourceType: 'image',
      format: 'pdf',
    });
  });

  it('previews raw PDFs with a raw private download URL', () => {
    expect(service.detectPreviewOptions('spec.pdf', 'pdf', 'raw', 'projects/demo/spec.pdf')).toEqual({
      canPreview: true,
      resourceType: 'raw',
      format: 'pdf',
    });
  });
});
