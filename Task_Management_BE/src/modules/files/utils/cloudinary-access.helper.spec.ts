import { ConfigService } from '@nestjs/config';
import { CloudinaryAccessHelper } from './cloudinary-access.helper';

describe('CloudinaryAccessHelper', () => {
  let helper: CloudinaryAccessHelper;

  beforeEach(() => {
    helper = new CloudinaryAccessHelper(new ConfigService({}));
  });

  it('uploads PDFs as raw files, not image resources', () => {
    expect(helper.resolveSupportedFileKind('document.pdf', 'application/pdf')).toEqual({
      resourceType: 'raw',
      enforcedFormat: undefined,
    });
  });
});
