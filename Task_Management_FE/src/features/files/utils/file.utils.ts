const FOLDER_PALETTE = ['#6366f1', '#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4']

const MEMBER_PALETTE = [
  '#6366f1', '#3b82f6', '#f59e0b', '#10b981',
  '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4',
  '#f97316', '#14b8a6', '#84cc16', '#a855f7',
]

const FILE_TYPE_LABELS: Record<string, string> = {
  pdf: 'PDF',
  doc: 'DOC',
  docx: 'DOC',
  xls: 'XLS',
  xlsx: 'XLS',
  jpg: 'IMG',
  jpeg: 'IMG',
  png: 'IMG',
  gif: 'GIF',
  webp: 'IMG',
  mp4: 'VID',
  mov: 'VID',
  avi: 'VID',
  mp3: 'AUD',
  wav: 'AUD',
  zip: 'ZIP',
  rar: 'ZIP',
  txt: 'TXT',
  fig: 'FIG',
  ai: 'AI',
}

const FILE_TYPE_COLORS: Record<string, string> = {
  PDF: '#ef4444',
  DOC: '#3b82f6',
  XLS: '#10b981',
  IMG: '#6366f1',
  GIF: '#8b5cf6',
  VID: '#f59e0b',
  AUD: '#ec4899',
  ZIP: '#64748b',
  TXT: '#94a3b8',
  FIG: '#06b6d4',
  AI: '#f97316',
  FILE: '#94a3b8',
}

function hashIndex(value: string, modulo: number): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash) % modulo
}

export function folderColor(path: string): string {
  return FOLDER_PALETTE[hashIndex(path, FOLDER_PALETTE.length)]
}

export function memberColor(id: string): string {
  return MEMBER_PALETTE[hashIndex(id, MEMBER_PALETTE.length)]
}

export function memberInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('')
}

export function getFileIconText(format: string): string {
  return FILE_TYPE_LABELS[(format || '').toLowerCase()] ?? 'FILE'
}

export function fileTypeBg(format: string): string {
  const key = getFileIconText(format)
  return (FILE_TYPE_COLORS[key] ?? '#94a3b8') + '22'
}

export function fileName(publicId: string): string {
  return publicId.split('/').pop() ?? publicId
}

export function formatBytes(bytes: number): string {
  if (!bytes) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB']
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = (bytes / 1024 ** unitIndex).toFixed(unitIndex >= 2 ? 1 : 0)

  return `${value} ${units[unitIndex]}`
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function extractErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error && 'response' in error) {
    const response = (error as { response?: { data?: unknown } }).response
    const payload = response?.data

    if (payload && typeof payload === 'object') {
      const direct = (payload as { message?: unknown }).message
      if (typeof direct === 'string') return direct

      const nested = (payload as { data?: { message?: unknown } }).data?.message
      if (typeof nested === 'string') return nested
    }
  }

  if (error instanceof Error && error.message) return error.message
  return fallback
}
