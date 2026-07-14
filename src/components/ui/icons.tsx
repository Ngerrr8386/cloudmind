import {
  FileText, FileSpreadsheet, Presentation, Image as ImageIcon, Video, Music,
  Code2, FileArchive, StickyNote, File, GraduationCap, Briefcase, Rocket,
  Image, Wallet, BookMarked, Folder as FolderIcon, type LucideIcon,
} from 'lucide-react'
import type { FileType } from '@/lib/types'
import { useT, type TranslationKey } from '@/lib/i18n'

/** Map folder icon name (string from data) → Lucide component. */
const folderIconMap: Record<string, LucideIcon> = {
  GraduationCap, Briefcase, Rocket, Image, Wallet, BookMarked, Folder: FolderIcon,
}

export function FolderGlyph({ name, className }: { name: string; className?: string }) {
  const Icon = folderIconMap[name] ?? FolderIcon
  return <Icon className={className} />
}

/** Map file type → icon + accent color (light theme). */
const fileTypeMap: Record<FileType, { Icon: LucideIcon; tint: string }> = {
  pdf: { Icon: FileText, tint: 'text-rose-600' },
  doc: { Icon: FileText, tint: 'text-sky-600' },
  sheet: { Icon: FileSpreadsheet, tint: 'text-emerald-600' },
  slide: { Icon: Presentation, tint: 'text-amber-600' },
  image: { Icon: ImageIcon, tint: 'text-violet-600' },
  video: { Icon: Video, tint: 'text-sky-600' },
  audio: { Icon: Music, tint: 'text-emerald-600' },
  code: { Icon: Code2, tint: 'text-ink-600' },
  archive: { Icon: FileArchive, tint: 'text-amber-600' },
  note: { Icon: StickyNote, tint: 'text-violet-600' },
}

export function FileTypeIcon({ type, className }: { type: FileType; className?: string }) {
  const { Icon } = fileTypeMap[type] ?? { Icon: File }
  return <Icon className={className} />
}

export function fileTint(type: FileType) {
  return fileTypeMap[type]?.tint ?? 'text-slate-500'
}

export const fileTypeLabel: Record<FileType, TranslationKey> = {
  pdf: 'ftype.pdf', doc: 'ftype.doc', sheet: 'ftype.sheet', slide: 'ftype.slide', image: 'ftype.image',
  video: 'ftype.video', audio: 'ftype.audio', code: 'ftype.code', archive: 'ftype.archive', note: 'ftype.note',
}

/** Hook trả về hàm dịch nhãn loại tệp — dùng khi component đã dùng biến tên `t` cho việc khác. */
export function useFileTypeLabel(): (type: FileType) => string {
  const t = useT()
  return (type) => t(fileTypeLabel[type])
}
