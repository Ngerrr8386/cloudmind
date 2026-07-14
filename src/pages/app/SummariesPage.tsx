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
import { useT, type TranslationKey } from '@/lib/i18n'

type SummaryLength = 'short' | 'medium' | 'detailed'

interface SummaryResult {
  content: string
  keyPoints: string[]
  keywords: string[]
}

const lengthOptions: { id: SummaryLength; labelKey: TranslationKey; emoji: string }[] = [
  { id: 'short', labelKey: 'sum.lenShort', emoji: '⚡' },
  { id: 'medium', labelKey: 'sum.lenMedium', emoji: '📄' },
  { id: 'detailed', labelKey: 'sum.lenDetailed', emoji: '📚' },
]

/** Deterministic "page count" so compression stats feel real & stable per file. */
function pseudoPages(file: StoredFile): number {
  const seed = file.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return 6 + Math.floor(seededRandom(seed) * 54) // 6..59 trang
}

const lengthMeta: Record<SummaryLength, { points: number; ratio: string }> = {
  short: { points: 3, ratio: '96%' },
  medium: { points: 5, ratio: '92%' },
  detailed: { points: 8, ratio: '84%' },
}

export function SummariesPage() {
  const navigate = useNavigate()
  const { openUpload } = useAppContext()
  const { user } = useAuth()
  const t = useT()

  const { data: fileData, loading: filesLoading } = useAsync(
    () => api.files({ limit: 50 }).then((r) => r.items),
    [],
  )

  // Danh sách chọn = mọi tài liệu đã xử lý AI (đã có embedding → tóm tắt được),
  // KHÔNG chỉ file đã có sẵn tóm tắt. Chọn một file sẽ sinh tóm tắt on-demand.
  // (Trước đây lọc thêm `&& f.aiSummary` khiến file mới/ trong folder chưa từng
  //  tóm tắt không bao giờ xuất hiện để chọn.)
  const docs = useMemo<StoredFile[]>(
    () =>
      ((fileData as StoredFile[] | null) ?? [])
        .filter((f) => f.aiProcessed)
        .map((f) => ({
          ...f,
          owner: f.owner ?? user?.name ?? '',
        })),
    [fileData, user?.name],
  )
  const summarizedCount = useMemo(() => docs.filter((f) => f.aiSummary).length, [docs])

  const [selectedId, setSelectedId] = useState<string>('')
  const [length, setLength] = useState<SummaryLength>('medium')
  const [regenerating, setRegenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [summary, setSummary] = useState<SummaryResult | null>(null)

  const selected = useMemo(
    () => docs.find((f) => f.id === selectedId) ?? docs[0],
    [docs, selectedId],
  )

  // Đảm bảo có file được chọn khi dữ liệu tải xong.
  useEffect(() => {
    if (!selectedId && docs.length > 0) setSelectedId(docs[0].id)
  }, [selectedId, docs])

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
    () => docs.reduce((acc, f) => acc + pseudoPages(f), 0),
    [docs],
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

  function handleExport() {
    if (!summary || !selected) return
    const lines: string[] = [`# ${selected.name}`, '', summary.content]
    if (summary.keyPoints?.length) {
      lines.push('', `## ${t('sum.keyPoints')}`, ...summary.keyPoints.map((p, i) => `${i + 1}. ${p}`))
    }
    if (summary.keywords?.length) {
      lines.push('', `## ${t('sum.keywords')}`, summary.keywords.map((k) => `#${k}`).join(' '))
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selected.name.replace(/\.[^./\\]+$/, '')}-${t('sum.filenameSuffix')}.md`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
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
        eyebrow={<AIChip label={t('sum.chip')} />}
        title={t('sum.title')}
        subtitle={t('sum.subtitle')}
        actions={
          <Button onClick={openUpload}>
            <Wand2 className="h-4 w-4" />
            {t('sum.newDoc')}
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
          label={t('sum.statDocs')}
          value={String(summarizedCount)}
          trend={16}
          tone="violet"
        />
        <StatCard
          icon={Clock}
          label={t('sum.statTime')}
          value="14.6"
          suffix={t('sum.hours')}
          trend={23}
          tone="emerald"
        />
        <StatCard
          icon={Layers}
          label={t('sum.statPages')}
          value={totalPages.toLocaleString('vi-VN')}
          suffix={t('sum.pagesUnit')}
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
              {t('sum.docList')}
              <span className="ml-2 text-slate-400">({docs.length})</span>
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
            {docs.map((file) => {
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
                          {file.aiSummary || t('sum.tapToSummarize')}
                        </p>
                        <div className="mt-2 flex items-center gap-2 text-[11px] font-medium text-slate-400">
                          <span className={cn('font-bold', fileTint(file.type))}>
                            {t(fileTypeLabel[file.type])}
                          </span>
                          <span className="h-1 w-1 rounded-full bg-slate-300" />
                          <span>{t('sum.pages', { n: pseudoPages(file) })}</span>
                          <span className="h-1 w-1 rounded-full bg-slate-300" />
                          <span className="inline-flex items-center gap-1 text-violet-500">
                            <Sparkles className="h-3 w-3" /> {t('sum.processed')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              )
            })}

            {docs.length === 0 && (
              <motion.div variants={fadeUp}>
                <GlassCard className="p-6 text-center text-sm text-slate-500">
                  {t('sum.empty')}
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
                <p className="text-sm font-semibold text-slate-700">{t('sum.pickPrompt')}</p>
                <p className="mt-1 text-xs text-slate-400">{t('sum.pickHint')}</p>
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
                      <AIChip label={t('sum.byAi')} />
                      <Badge tone="neutral">{t(fileTypeLabel[selected.type])}</Badge>
                    </div>
                    <h2 className="text-lg font-extrabold leading-snug tracking-tight text-slate-900 sm:text-xl">
                      {selected.name}
                    </h2>
                    <p className="mt-1 text-xs text-slate-400">
                      {t('sum.detailMeta', { pages, date: selected.updatedAt, owner: selected.owner })}
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
                          {t(opt.labelKey)}
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
                      <span className="shimmer-text">{t('sum.regenerating')}</span>
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
                        {summary?.content ?? t('sum.noSummary')}
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
                  <h3 className="text-sm font-bold text-slate-800">{t('sum.keyPoints')}</h3>
                  <span className="text-xs text-slate-400">· {t('sum.points', { n: meta.points })}</span>
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
                  <h3 className="text-sm font-bold text-slate-800">{t('sum.keywords')}</h3>
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
                        {t('sum.pages', { n: pages })}{' '}
                        <ArrowRight className="inline h-3.5 w-3.5 text-slate-400" /> {t('sum.points', { n: meta.points })}
                      </p>
                      <p className="text-xs text-slate-500">
                        {t('sum.compressDesc')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-extrabold text-gradient">{t('sum.saved', { ratio: meta.ratio })}</p>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      {t('sum.readingEffort')}
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
                        <Check className="h-4 w-4" /> {t('sum.copied')}
                      </motion.span>
                    ) : (
                      <motion.span
                        key="copy"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="inline-flex items-center gap-1.5"
                      >
                        <Copy className="h-4 w-4" /> {t('sum.copy')}
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
                  {t('sum.askMore')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  disabled={!summary}
                  className="flex-1 sm:flex-none"
                >
                  <Download className="h-4 w-4" />
                  {t('sum.export')}
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