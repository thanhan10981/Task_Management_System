// ─── User ────────────────────────────────────────────────────────────────────
export interface User {
  id: string
  email: string
  fullName: string
  avatarUrl?: string
  createdAt: string
  updatedAt: string
}

// ─── Common ──────────────────────────────────────────────────────────────────
export interface SelectOption {
  label: string
  value: string | number
}
