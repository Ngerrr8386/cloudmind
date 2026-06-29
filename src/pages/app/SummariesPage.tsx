import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles,
  Copy,
  MessageCircleQuestion,
  Download,
  Check,
  Zap,
  Layers,
  Clock,
  ListChecks,
  Tag,
  Wand2,
  ArrowRight,
} from 'lucide-react'
import {
  GlassCard,
  Badge,
  Button,
  AIChip,
  FileTypeIcon,
  fileTint,
  fileTypeLabel,
} from '@/components/ui'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { useAppContext } from '@/lib/hooks'
import { useAuth } from '@/lib/auth'
import { useAsync } from '@/lib/useApi'
import { api } from '@/lib/api'
import type { StoredFile } from '@/lib/types'
import { fadeUp, staggerContainer, spring, softSpring } from '@/lib/motion'
import { cn, seededRandom } from '@/lib/utils'
import { tone } from '@/lib/theme'

type SummaryLength = 'short' | 'medium' | 'detailed'

interface SummaryResult {
  content: string
  keyPoints: string[]
  keywords: string[]
}

const lengthOptions: { id: SummaryLength; label: string; emoji: string }[] = [
  { id: 'short', label: 'Ngắn', emoji: '⚡' },
  { id: 'medium', label: 'Vừa', emoji: '📄' },
  { id: 'detailed', label: 'Chi tiết', emoji: '📚' },
]

/** Deterministic "page count" so compression stats feel real & stable per file. */
function pseudoPages(file: StoredFile): number {
  const seed = file.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return 6 + Math.floor(seededRandom(seed) * 54) // 6..59 trang
}

const lengthMeta: Record<SummaryLength, { points: string; ratio: string }> = {
  short: { points: '3 ý', ratio: '96%' },
  medium: { points: '5 ý', ratio: '92%' },
  detailed: { points: '8 ý', ratio: '84%' },
}

export function SummariesPage() {
  const navigate = useNavigate()
  const { openUpload } = useAppContext()
  const { user } = useAuth()

  const { data: fileData, loading: filesLoading } = useAsync(
    () => api.files({ limit: 50 }).then((r) => r.items),
    [],
  )

  const summarized = useMemo<StoredFile[]>(
    () =>
      ((fileData as StoredFile[] | null) ?? []).map((f) => ({
        ...f,
        owner: f.owner ?? user?.name ?? '',
      })),
    [fileData, user?.name],
  )

  const [selectedId, setSelectedId] = useState<string>('')
  const [length, setLength] = useState<SummaryLength>('medium')
  const [regenerating, setRegenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [summary, setSummary] = useState<SummaryResult | null>(null)

  const selected = useMemo(
    () => summarized.find((f) => f.id === selectedId) ?? summarized[0],
    [summarized, selectedId],
  )

  // Đảm bảo có file được chọn khi dữ liệu tải xong.
  useEffect(() => {
    if (!selectedId && summarized.length > 0) setSelectedId(summarized[0].id)
  }, [selectedId, summarized])

  // Tải tóm tắt cho file đang chọn + độ dài hiện tại.
  useEffect(() => {
    if (!selected) {
      setSummary(null)
      return
    }
    let active = true
    setRegenerating(true)
    api
      .summarize(selected.id, length)
      .then((res: SummaryResult) => {
        if (active) setSummary(res)
      })
      .catch(() => {
        if (active) setSummary(null)
      })
      .finally(() => {
        if (active) setRegenerating(false)
      })
    return () => {
      active = false
    }
  }, [selected?.id, length])

  const totalPages = useMemo(
    () => summarized.reduce((acc, f) => acc + pseudoPages(f), 0),
    [summarized],
  )

  function handleSelect(id: string) {
    if (id === selectedId) return
    setSelectedId(id)
    setCopied(false)
  }

  function handleLength(next: SummaryLength) {
    if (next === length) return
    setLength(next)
  }

  function handleCopy() {
    if (!summary) return
    void navigator.clipboard?.writeText(summary.content).catch(() => {})
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  if (filesLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-violet-500" />
      </div>
    )
  }

  const pages = selected ? pseudoPages(selected) : 0
  const points = summary?.keyPoints ?? []
  const keywords = summary?.keywords ?? selected?.tags ?? []
  const meta = lengthMeta[length]

  return (
    <div className="pb-12">
      <PageHeader
        eyebrow={<AIChip label="AI Summaries" />}
        title="Tóm tắt thông minh 🪄"
        subtitle="Quăng tài liệu dài thượt vào đây, AI nhả ra ý chính trong vài giây. Đọc 5 ý thay vì 40 trang — sướng cái não!"
        actions={
          <Button onClick={openUpload}>
            <Wand2 className="h-4 w-4" />
            Tóm tắt tài liệu mới
          </Button>
        }
      />

      {/* Stats */}
      <motion.div
        variants={staggerContainer()}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        <StatCard
          icon={ListChecks}
          label="Tài liệu đã tóm tắt"
          value={String(summarized.length)}
          trend={16}
          tone="violet"
        />
        <StatCard
          icon={Clock}
          label="Thời gian tiết kiệm"
          value="14.6"
          suffix="giờ"
          trend={23}
          tone="emerald"
        />
        <StatCard
          icon={Layers}
          label="Trang đã xử lý"
          value={totalPages.toLocaleString('vi-VN')}
          suffix="trang"
          trend={9}
          tone="indigo"
        />
      </motion.div>

      {/* Main two-column layout */}
      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        {/* Left: selectable doc list */}
        <div>
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-slate-700">
              Đã tóm tắt
              <span className="ml-2 text-slate-400">({summarized.length})</span>
            </h2>
            <Badge tone="ai" dot>
              live
            </Badge>
          </div>

          <motion.div
            variants={staggerContainer(0.06)}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-3"
          >
            {summarized.map((file) => {
              const active = file.id === selectedId
              return (
                <motion.div key={file.id} variants={fadeUp}>
                  <GlassCard
                    interactive
                    onClick={() => handleSelect(file.id)}
                    className={cn(
                      'group relative overflow-hidden p-4 transition-all',
                      active
                        ? 'border-violet-300 bg-violet-50 shadow-glow'
                        : 'hover:border-slate-300',
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="summary-active-bar"
                        className="absolute inset-y-3 left-0 w-1 rounded-full bg-gradient-to-b from-grape-500 to-candy-500"
                        transition={spring}
                      />
                    )}
                    <div className="flex items-start gap-3 pl-1">
                      <div
                        className={cn(
                          'grid h-11 w-11 shrink-0 place-items-center rounded-2xl shadow-card',
                          tone(file.tone).soft,
                        )}
                      >
                        <FileTypeIcon type={file.type} className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {file.name}
                          </p>
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
                          {file.aiSummary}
                        </p>
                        <div className="mt-2 flex items-center gap-2 text-[11px] font-medium text-slate-400">
                          <span className={cn('font-bold', fileTint(file.type))}>
                            {fileTypeLabel[file.type]}
                          </span>
                          <span className="h-1 w-1 rounded-full bg-slate-300" />
                          <span>{pseudoPages(file)} trang</span>
                          <span className="h-1 w-1 rounded-full bg-slate-300" />
                          <span className="inline-flex items-center gap-1 text-violet-500">
                            <Sparkles className="h-3 w-3" /> đã xử lý
                          </span>
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              )
            })}

            {summarized.length === 0 && (
              <motion.div variants={fadeUp}>
                <GlassCard className="p-6 text-center text-sm text-slate-500">
                  Chưa có tài liệu nào — hãy tải lên để AI tóm tắt giúp bạn! ✨
                </GlassCard>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Right: summary detail */}
        <GlassCard className="relative overflow-hidden p-0">
          {/* ambient glow */}
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-violet-100/60 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-indigo-100/50 blur-3xl" />

          {!selected ? (
            <div className="grid min-h-[320px] place-items-center p-8 text-center">
              <div>
                <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-brand shadow-glow">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <p className="text-sm font-semibold text-slate-700">Chọn một tài liệu để xem tóm tắt</p>
                <p className="mt-1 text-xs text-slate-400">AI sẽ chắt lọc ý chính chỉ trong vài giây.</p>
              </div>
            </div>
          ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={spring}
              className="relative p-5 sm:p-7"
            >
              {/* header */}
              <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      'grid h-14 w-14 shrink-0 place-items-center rounded-2xl shadow-card',
                      tone(selected.tone).soft,
                    )}
                  >
                    <FileTypeIcon type={selected.type} className="h-7 w-7" />
                  </div>
                  <div className="min-w-0">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <AIChip label="Tóm tắt bởi AI" />
                      <Badge tone="neutral">{fileTypeLabel[selected.type]}</Badge>
                    </div>
                    <h2 className="text-lg font-extrabold leading-snug tracking-tight text-slate-900 sm:text-xl">
                      {selected.name}
                    </h2>
                    <p className="mt-1 text-xs text-slate-400">
                      {pages} trang · cập nhật {selected.updatedAt} · {selected.owner}
                    </p>
                  </div>
                </div>
              </div>

              {/* segmented length control */}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center gap-1 rounded-2xl bg-slate-50 p-1 ring-1 ring-slate-200">
                  {lengthOptions.map((opt) => {
                    const on = opt.id === length
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleLength(opt.id)}
                        className={cn(
                          'relative rounded-xl px-3.5 py-1.5 text-xs font-bold transition-colors sm:text-sm',
                          on ? 'text-white' : 'text-slate-500 hover:text-slate-700',
                        )}
                      >
                        {on && (
                          <motion.span
                            layoutId="length-pill"
                            className="absolute inset-0 rounded-xl bg-gradient-to-r from-grape-500 to-candy-500 shadow-glow"
                            transition={softSpring}
                          />
                        )}
                        <span className="relative flex items-center gap-1.5">
                          <span>{opt.emoji}</span>
                          {opt.label}
                        </span>
                      </button>
                    )
                  })}
                </div>

                <AnimatePresence>
                  {regenerating && (
                    <motion.span
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      className="inline-flex items-center gap-2 text-xs font-semibold text-violet-600"
                    >
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                      </motion.span>
                      <span className="shimmer-text">đang tạo lại...</span>
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              {/* summary body */}
              <div className="mt-5">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={length + (regenerating ? '-loading' : '')}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.28 }}
                  >
                    {regenerating ? (
                      <div className="space-y-2.5">
                        {[100, 92, 84, 70].map((w, i) => (
                          <div
                            key={i}
                            className="h-3.5 rounded-full bg-slate-100 shimmer"
                            style={{ width: `${w}%` }}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-[15px] leading-relaxed text-slate-600">
                        {summary?.content ?? 'Chưa có tóm tắt cho tài liệu này.'}
                      </p>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Key points */}
              <div className="mt-7">
                <div className="mb-3 flex items-center gap-2">
                  <div className={cn('grid h-7 w-7 place-items-center rounded-xl', tone('emerald').soft)}>
                    <ListChecks className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">Điểm chính</h3>
                  <span className="text-xs text-slate-400">· {meta.points}</span>
                </div>
                <motion.ul
                  key={selected.id + length + '-points'}
                  variants={staggerContainer(0.07)}
                  initial="hidden"
                  animate="show"
                  className="space-y-2.5"
                >
                  {points.map((p, i) => (
                    <motion.li
                      key={i}
                      variants={fadeUp}
                      className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200 transition-colors hover:bg-slate-100"
                    >
                      <span className={cn('mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg text-xs font-extrabold', tone('violet').soft)}>
                        {i + 1}
                      </span>
                      <span className="text-sm leading-relaxed text-slate-600">{p}</span>
                    </motion.li>
                  ))}
                </motion.ul>
              </div>

              {/* Keywords */}
              <div className="mt-7">
                <div className="mb-3 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-sky-500" />
                  <h3 className="text-sm font-bold text-slate-800">Từ khóa</h3>
                </div>
                <motion.div
                  variants={staggerContainer(0.05)}
                  initial="hidden"
                  animate="show"
                  className="flex flex-wrap gap-2"
                >
                  {keywords.map((kw, i) => (
                    <motion.span key={kw + i} variants={fadeUp}>
                      <Badge tone={i % 3 === 0 ? 'ai' : i % 3 === 1 ? 'sky' : 'mint'}>
                        #{kw}
                      </Badge>
                    </motion.span>
                  ))}
                </motion.div>
              </div>

              {/* Compression stat */}
              <motion.div
                key={selected.id + length + '-compress'}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={spring}
                className="mt-7 overflow-hidden rounded-2xl bg-slate-50 ring-1 ring-slate-200"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-brand shadow-glow">
                      <Zap className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {pages} trang{' '}
                        <ArrowRight className="inline h-3.5 w-3.5 text-slate-400" /> {meta.points}
                      </p>
                      <p className="text-xs text-slate-500">
                        AI nén nội dung mà vẫn giữ nguyên ý cốt lõi 🤏
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-extrabold text-gradient">tiết kiệm {meta.ratio}</p>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      công sức đọc
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Actions */}
              <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
                <Button variant="glass" size="sm" onClick={handleCopy} className="flex-1 sm:flex-none">
                  <AnimatePresence mode="wait" initial={false}>
                    {copied ? (
                      <motion.span
                        key="copied"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="inline-flex items-center gap-1.5 text-emerald-600"
                      >
                        <Check className="h-4 w-4" /> Đã chép!
                      </motion.span>
                    ) : (
                      <motion.span
                        key="copy"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="inline-flex items-center gap-1.5"
                      >
                        <Copy className="h-4 w-4" /> Sao chép
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/app/chat')}
                  className="flex-1 sm:flex-none"
                >
                  <MessageCircleQuestion className="h-4 w-4" />
                  Hỏi thêm
                </Button>
                <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                  <Download className="h-4 w-4" />
                  Xuất
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
          )}
        </GlassCard>
      </div>
    </div>
  )
}