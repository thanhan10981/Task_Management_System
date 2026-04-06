export interface CloudinaryFolderItem {
  name: string;
  path: string;
}

export interface CloudinaryResourceItem {
  public_id: string;
  format?: string;
  resource_type?: string;
  bytes?: number;
  secure_url?: string;
  created_at?: string;
}

export interface CloudinaryErrorPayload {
  message: string;
  http_code?: number;
}

export interface CloudinaryFolderListResponse {
  folders?: CloudinaryFolderItem[];
  next_cursor?: string;
}

export interface CloudinaryResourceListResponse {
  resources?: CloudinaryResourceItem[];
  next_cursor?: string;
}

export interface CloudinaryDeleteResourceResponse {
  result?: string;
}

export interface UploadedMemoryFile {
  buffer: Buffer;
}
