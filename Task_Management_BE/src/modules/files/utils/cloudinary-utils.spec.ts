import {
  deriveFolderFromPublicId,
  escapeSearchValue,
  hasRootFoldersApi,
  isAlreadyExistsError,
  isFolderMarkerResource,
  isNotFoundError,
  mapCloudinaryResource,
  normalizePath,
  toResourceType,
} from './cloudinary-utils';

describe('cloudinary-utils', () => {
  it('normalizes paths by trimming outer slashes and whitespace', () => {
    expect(normalizePath(' /projects/demo/ ')).toBe('projects/demo');
    expect(normalizePath(' / ')).toBeUndefined();
  });

  it('escapes Cloudinary search values', () => {
    expect(escapeSearchValue('a\\b"c')).toBe('a\\\\b\\"c');
  });

  it('detects Cloudinary error shapes', () => {
    expect(isNotFoundError({ http_code: 404 })).toBe(true);
    expect(isNotFoundError({ statusCode: 404 })).toBe(true);
    expect(isNotFoundError({ response: { status: 404 } })).toBe(true);
    expect(isNotFoundError({ message: 'Folder projects/new-id does not exist' })).toBe(true);
    expect(isAlreadyExistsError({ http_code: 409, message: 'Folder already exists' })).toBe(true);
    expect(isAlreadyExistsError({ http_code: 409, message: 'Conflict' })).toBe(false);
  });

  it('derives direct folders from public ids', () => {
    expect(deriveFolderFromPublicId('projects/a/file.pdf')).toBe('projects');
    expect(deriveFolderFromPublicId('projects/a/file.pdf', 'projects')).toBe('projects/a');
    expect(deriveFolderFromPublicId('other/a/file.pdf', 'projects')).toBe('');
  });

  it('maps resources and validates resource types', () => {
    const mapped = mapCloudinaryResource({
      public_id: 'p',
      secure_url: 'url',
      format: 'png',
      resource_type: 'image',
      bytes: 12,
      created_at: 'now',
      asset_folder: 'folder',
      ignored: true,
    } as any);

    expect(mapped).toEqual({
      public_id: 'p',
      secure_url: 'url',
      format: 'png',
      resource_type: 'image',
      bytes: 12,
      created_at: 'now',
      asset_folder: 'folder',
    });
    expect(toResourceType('raw')).toBe('raw');
    expect(toResourceType('audio')).toBeNull();
  });

  it('detects folder markers and root folder API support', () => {
    expect(isFolderMarkerResource('projects/.folder-marker')).toBe(true);
    expect(hasRootFoldersApi({ root_folders: jest.fn() })).toBe(true);
    expect(hasRootFoldersApi({})).toBe(false);
  });
});
