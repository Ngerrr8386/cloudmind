import type { LucideIcon } from 'lucide-react'
import type { Tone } from './theme'

export type FileType =
  | 'pdf'
  | 'doc'
  | 'sheet'
  | 'slide'
  | 'image'
  | 'video'
  | 'audio'
  | 'code'
  | 'archive'
  | 'note'

export interface StoredFile {
  id: string
  name: string
  type: FileType
  size: number // bytes
  folderId: string
  createdAt: string
  updatedAt: string
  owner: string
  starred: boolean
  shared: boolean
  aiProcessed: boolean
  /** trạng thái lập chỉ mục AI (embedding) */
  embedStatus?: 'pending' | 'processing' | 'done' | 'failed'
  aiSummary?: string
  tags: string[]
  /** flat tint tone used for thumbnails */
  tone: Tone
}

export interface Folder {
  id: string
  name: string
  icon: string // lucide icon name
  tone: Tone // flat tint tone
  fileCount: number
  size: number
  parentId: string | null
  /** Nếu có: thư mục đang được chia sẻ trong không gian nhóm này. */
  workspaceId?: string | null
}

export interface FolderSuggestion {
  folderId: string
  folderName: string
  confidence: number // 0..1
  reason: string
}

export interface ChatSource {
  fileId: string
  fileName: string
  fileType: FileType
  snippet: string
  page?: number
  relevance: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  sources?: ChatSource[]
  thinking?: string
}

export interface SearchResult {
  file: StoredFile
  relevance: number // 0..1
  snippet: string
  matchedConcepts: string[]
}

export interface Insight {
  id: string
  title: string
  description: string
  icon: string
  trend: number // % change
  tone: Tone
}

export interface ActivityItem {
  id: string
  type: 'upload' | 'ai' | 'share' | 'summary' | 'search' | 'edit'
  title: string
  detail: string
  timestamp: string
}

export interface PricingPlan {
  id: string
  name: string
  tagline: string
  priceMonthly: number // VND
  priceYearly: number // VND/month when billed yearly
  storage: string
  highlight: boolean
  badge?: string
  features: { text: string; included: boolean }[]
  tone: Tone
  cta: string
  pricingModel?: string // 'flat' | 'per_seat' (từ API)
  includedSeats?: number // số ghế kèm theo — chỉ có ở gói per_seat
}

export interface AppUser {
  name: string
  handle: string
  email: string
  initials: string
  tone: Tone
  plan: string
  storageUsed: number
  storageTotal: number
}

export interface IconRef {
  icon: LucideIcon
}
