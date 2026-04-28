import { getFileDownloadUrl, getFilePreviewUrl, type SignedDownloadAccess } from '@/api/cloudinary'
import { QUERY_KEYS } from '@/constants/query-keys'
import { useQuery } from '@tanstack/vue-query'
import { computed, unref, type MaybeRef } from 'vue'

export function useFilePreviewAccessQuery(
  fileId: MaybeRef<string>,
  enabled: MaybeRef<boolean> = true,
) {
  return useQuery({
    queryKey: computed(() => QUERY_KEYS.files.access(unref(fileId), 'preview')),
    enabled: computed(() => Boolean(unref(enabled)) && Boolean(unref(fileId))),
    queryFn: () => getFilePreviewUrl(unref(fileId)),
  })
}

export function useFileDownloadAccessQuery(
  fileId: MaybeRef<string>,
  enabled: MaybeRef<boolean> = true,
) {
  return useQuery({
    queryKey: computed(() => QUERY_KEYS.files.access(unref(fileId), 'download')),
    enabled: computed(() => Boolean(unref(enabled)) && Boolean(unref(fileId))),
    queryFn: (): Promise<SignedDownloadAccess> => getFileDownloadUrl(unref(fileId)),
  })
}
