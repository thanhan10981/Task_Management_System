import {
  createCloudinaryFolder,
  deleteFileMetadata,
  uploadProjectFileWithSignature,
  type CloudinaryUploadResult,
  type UploadProgressEvent,
} from '@/api/cloudinary'
import { QUERY_KEYS } from '@/constants/query-keys'
import { useMutation, useQueryClient } from '@tanstack/vue-query'

interface CreateFolderInput {
  projectId: string
  folderPath: string
}

interface UploadSignedFileInput {
  projectId: string
  file: File
  taskId?: string
  commentId?: string
  folderPath?: string
  onProgress?: (event: UploadProgressEvent) => void
}

export function useCreateCloudinaryFolderMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ projectId, folderPath }: CreateFolderInput) => createCloudinaryFolder(projectId, folderPath),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.files.all }),
  })
}

export function useSignedFileUploadMutation() {
  const queryClient = useQueryClient()

  return useMutation<CloudinaryUploadResult, Error, UploadSignedFileInput>({
    mutationFn: ({ projectId, file, taskId, commentId, folderPath, onProgress }) =>
      uploadProjectFileWithSignature(projectId, file, {
        taskId,
        commentId,
        folderPath,
        onProgress,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.files.all }),
  })
}

export function useDeleteFileMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteFileMetadata,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.files.all }),
  })
}
