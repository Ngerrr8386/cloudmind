import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Star, MoreHorizontal, Users, Sparkles, Download, Share2, Trash2, Loader2, AlertTriangle } from 'lucide-react'
import { GlassCard, FileTypeIcon, fileTint, fileTypeLabel, Badge } from '@/components/ui'
import type { StoredFile } from '@/lib/types'
import { formatBytes, timeAgo, cn } from '@/lib/utils'
import { tone as toneClasses } from '@/lib/theme'
import { fadeUp } from '@/lib/motion'

/** Trạng thái lập chỉ mục AI (embedding). Fallback aiProcessed cho file cũ. */
function EmbedBadge({ file, compact = false }: { file: StoredFile; compact?: boolean }) {
  const s = file.embedStatus ?? (file.aiProcessed ? 'done' : undefined)

  if (s === 'pending' || s === 'processing') {
    if (compact) return <Loader2 className="h-3 w-3 shrink-0 animate-spin text-amber-500" aria-label="AI đang xử lý" />
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50/90 px-2 py-0.5 text-[10px] font-bold text-amber-600 backdrop-blur-sm">
        <Loader2 className="h-2.5 w-2.5 animate-spin" /> AI đang xử lý
      </span>
    )
  }
  if (s === 'failed') {
    if (compact) return <AlertTriangle className="h-3 w-3 shrink-0 text-rose-500" aria-label="Lỗi lập chỉ mục" />
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50/90 px-2 py-0.5 text-[10px] font-bold text-rose-600 backdrop-blur-sm">
        <AlertTriangle className="h-2.5 w-2.5" /> Lỗi index
      </span>
    )
  }
  if (s === 'done') {
    if (compact) return <Sparkles className="h-3 w-3 shrink-0 text-ink-400" aria-label="Đã lập chỉ mục" />
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-bold text-ink-600 backdrop-blur-sm">
        <Sparkles className="h-2.5 w-2.5" /> AI
      </span>
    )
  }
  return null
}

export interface FileActions {
  onStar?: () => void
  onDownload?: () => void
  onShare?: () => void
  onTrash?: () => void
}

/** Menu thao tác 3 chấm (dùng chung cho card & row). */
function FileMenu({ file, onStar, onDownload, onShare, onTrash }: { file: StoredFile } & FileActions) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const items = [
    onStar && { icon: Star, label: file.starred ? 'Bỏ đánh dấu' : 'Đánh dấu sao', fn: onStar },
    onDownload && { icon: Download, label: 'Tải xuống', fn: onDownload },
    onShare && { icon: Share2, label: 'Chia sẻ', fn: onShare },
    onTrash && { icon: Trash2, label: 'Xoá', fn: onTrash, danger: true },
  ].filter(Boolean) as { icon: typeof Star; label: string; fn: () => void; danger?: boolean }[]

  if (!items.length) return <MoreHorizontal className="h-4 w-4 text-slate-300" />

  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v) }}
        className={cn(
          'grid h-7 w-7 place-items-center rounded-lg text-slate-400 opacity-0 transition-all hover:bg-slate-100 hover:text-slate-700 group-hover:opacity-100',
          open && 'opacity-100',
        )}
        aria-label="Tùy chọn"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-30 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-[0_12px_32px_-12px_rgba(16,24,40,0.25)]">
          {items.map((it) => (
            <button
              key={it.label}
              onClick={(e) => { e.stopPropagation(); setOpen(false); it.fn() }}
              className={cn('flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-slate-50', it.danger ? 'text-rose-600' : 'text-slate-700')}
            >
              <it.icon className="h-4 w-4" />
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/** Grid file card. */
export function FileCard({ file, onClick, ...actions }: { file: StoredFile; onClick?: () => void } & FileActions) {
  const t = toneClasses(file.tone)
  return (
    <motion.div variants={fadeUp}>
      <GlassCard interactive onClick={onClick} className="group overflow-hidden p-0">
        {/* Thumbnail — soft flat tint */}
        <div className={cn('relative h-28', t.soft)}>
          <div className="absolute inset-0 grid place-items-center">
            <FileTypeIcon type={file.type} className="h-10 w-10 opacity-80" />
          </div>
          <div className="absolute left-3 top-3 flex gap-1.5">
            <Badge tone="neutral" className="bg-white/80 backdrop-blur-sm">{fileTypeLabel[file.type]}</Badge>
          </div>
          <div className="absolute right-3 top-3 flex gap-1">
            {file.starred && <span className="grid h-6 w-6 place-items-center rounded-lg bg-white/80 backdrop-blur-sm"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /></span>}
            {file.shared && <span className="grid h-6 w-6 place-items-center rounded-lg bg-white/80 backdrop-blur-sm"><Users className="h-3.5 w-3.5 text-slate-600" /></span>}
          </div>
          <div className="absolute bottom-2 right-3">
            <EmbedBadge file={file} />
          </div>
        </div>
        {/* Meta */}
        <div className="p-4">
          <div className="flex items-start gap-2">
            <FileTypeIcon type={file.type} className={cn('mt-0.5 h-4 w-4 shrink-0', fileTint(file.type))} />
            <p className="line-clamp-2 flex-1 text-sm font-semibold leading-snug text-slate-800">{file.name}</p>
            <FileMenu file={file} {...actions} />
          </div>
          {file.aiSummary && <p className="mt-2 line-clamp-2 text-xs text-slate-400">{file.aiSummary}</p>}
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
            <span>{formatBytes(file.size)}</span>
            <span>{timeAgo(file.updatedAt)}</span>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  )
}

/** List file row. */
export function FileRow({ file, onClick, ...actions }: { file: StoredFile; onClick?: () => void } & FileActions) {
  const t = toneClasses(file.tone)
  return (
    <motion.div
      variants={fadeUp}
      onClick={onClick}
      role="button"
      tabIndex={0}
      className="group flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-transparent px-3 py-2.5 text-left transition-colors hover:border-slate-200 hover:bg-slate-50"
    >
      <div className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-xl', t.soft)}>
        <FileTypeIcon type={file.type} className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-slate-800">{file.name}</p>
          {file.starred && <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" />}
          <EmbedBadge file={file} compact />
        </div>
        <p className="truncate text-xs text-slate-400">{file.aiSummary ?? fileTypeLabel[file.type]}</p>
      </div>
      <div className="hidden shrink-0 items-center gap-6 text-xs text-slate-400 sm:flex">
        <span className="w-16 text-right tabular-nums">{formatBytes(file.size)}</span>
        <span className="w-24 text-right">{timeAgo(file.updatedAt)}</span>
      </div>
      <div className="shrink-0">
        <FileMenu file={file} {...actions} />
      </div>
    </motion.div>
  )
}
