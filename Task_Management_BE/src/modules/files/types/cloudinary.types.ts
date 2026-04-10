export type CloudinaryResourceType = 'image' | 'video' | 'raw';

export interface CloudinaryResourcePayload {
  public_id: string;
  secure_url?: string;
  format?: string;
  resource_type?: string;
  bytes?: number;
  created_at?: string;
  asset_folder?: string;
}

export interface CloudinaryFolderPayload {
  path: string;
  name: string;
}

export interface CloudinaryFolderWithCountPayload extends CloudinaryFolderPayload {
  fileCount: number;
}

interface CloudinaryFolderApiItem {
  path?: string;
  name?: string;
}

export interface CloudinaryFolderListResponse {
  folders?: CloudinaryFolderApiItem[];
  next_cursor?: string;
}

export interface CloudinaryRootFoldersApi {
  root_folders: (options?: { max_results?: number; next_cursor?: string }) => Promise<CloudinaryFolderListResponse>;
}

export interface CloudinaryResourceListResponse {
  resources?: CloudinaryResourcePayload[];
  next_cursor?: string;
}

export interface CloudinarySearchQuery {
  next_cursor: (cursor: string) => CloudinarySearchQuery;
  execute: () => Promise<CloudinaryResourceListResponse>;
}
