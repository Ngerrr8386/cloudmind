import { useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Sparkles,
  Zap,
  FileText,
  Clock,
  FolderOpen,
  Filter,
  ArrowRight,
  Quote,
  ChevronRight,
  X,
} from 'lucide-react'
import {
  Button,
  Badge,
  GlassCard,
  Input,
  AIChip,
  FileTypeIcon,
  fileTint,
  ConfidenceMeter,
} from '@/components/ui'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { api } from '@/lib/api'
import { useAsync } from '@/lib/useApi'
import type { SearchResult, Folder, FileType } from '@/lib/types'
import { cn, formatBytes, timeAgo } from '@/lib/utils'
import { fadeUp, fadeUpLg, popIn, scaleIn, staggerContainer } from '@/lib/motion'
import { tone } from '@/lib/theme'
import { useT, type TranslationKey } from '@/lib/i18n'

type SearchMode = 'semantic' | 'keyword' | 'hybrid'

const SEARCH_MODES: { id: SearchMode; key: TranslationKey; icon: typeof Sparkles }[] = [
  { id: 'semantic', key: 'search.modeSemantic', icon: Sparkles },
  { id: 'keyword', key: 'search.modeKeyword', icon: Search },
  { id: 'hybrid', key: 'search.modeHybrid', icon: Zap },
]

// Giá trị filter giữ nguyên tiếng Việt làm ID ổn định (khớp map logic & tên
// folder từ backend); chỉ phần hiển thị được dịch qua các map key bên dưới.
const FILE_TYPE_FILTERS = ['Tất cả', 'PDF', 'Slide', 'Bảng tính', 'Code', 'Audio']
const FOLDER_FILTERS = ['Mọi thư mục', 'Đại học', 'Công việc', 'Dự án cá nhân', 'Đọc sau']
const TIME_FILTERS = ['Mọi lúc', '7 ngày', '30 ngày', 'Năm nay']

const FILE_TYPE_KEYS: Record<string, TranslationKey> = {
  'Tất cả': 'search.ftAll',
  PDF: 'search.ftPdf',
  Slide: 'search.ftSlide',
  'Bảng tính': 'search.ftSheet',
  Code: 'search.ftCode',
  Audio: 'search.ftAudio',
}
const FOLDER_KEYS: Record<string, TranslationKey> = {
  'Mọi thư mục': 'search.fdAll',
  'Đại học': 'search.fdUniv',
  'Công việc': 'search.fdWork',
  'Dự án cá nhân': 'search.fdPersonal',
  'Đọc sau': 'search.fdReadLater',
}
const TIME_KEYS: Record<string, TranslationKey> = {
  'Mọi lúc': 'search.tmAll',
  '7 ngày': 'search.tm7d',
  '30 ngày': 'search.tm30d',
  'Năm nay': 'search.tmYear',
}

// Map nhãn chip → các FileType khớp (lọc client-side).
const FILE_TYPE_TO_TYPES: Record<string, FileType[]> = {
  PDF: ['pdf'],
  Slide: ['slide'],
  'Bảng tính': ['sheet'],
  Code: ['code'],
  Audio: ['audio'],
}

// Map nhãn thời gian → số ngày tính từ hiện tại ('Năm nay' = 365 ngày).
const TIME_TO_DAYS: Record<string, number> = {
  '7 ngày': 7,
  '30 ngày': 30,
  'Năm nay': 365,
}

export function SearchPage() {
  const t = useT()
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState<SearchMode>('semantic')
  const [submitted, setSubmitted] = useState(false)

  // Filter chip state
  const [fileType, setFileType] = useState('Tất cả')
  const [folder, setFolder] = useState('Mọi thư mục')
  const [time, setTime] = useState('Mọi lúc')

  // Dữ liệu từ API
  const { data: suggestionsData } = useAsync(
    () => api.aiSuggestions() as Promise<{ suggestions: string[] }>,
    [],
  )
  const suggestedPrompts: string[] = suggestionsData?.suggestions ?? []

  const { data: foldersData } = useAsync(() => api.folders() as Promise<Folder[]>, [])

  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [elapsed, setElapsed] = useState<number | null>(null)

  const hasQuery = query.trim().length > 0

  const folderNameById = useMemo(() => {
    const map = new Map<string, string>()
    ;(foldersData ?? []).forEach((f) => map.set(f.id, f.name))
    return map
  }, [foldersData])

  // Lọc client-side theo các FilterChip (loại file / thư mục / thời gian).
  const filteredResults = useMemo(() => {
    return results.filter((r) => {
      const file = r.file

      // Loại file
      if (fileType !== FILE_TYPE_FILTERS[0]) {
        const label = FILE_TYPE_TO_TYPES[fileType]
        if (label && !label.includes(file.type)) return false
      }

      // Thư mục (khớp theo tên hoặc ID)
      if (folder !== FOLDER_FILTERS[0]) {
        const name = folderNameById.get(file.folderId)
        if (name !== folder && file.folderId !== folder) return false
      }

      // Thời gian (dựa trên updatedAt)
      if (time !== TIME_FILTERS[0]) {
        const days = TIME_TO_DAYS[time]
        if (days != null) {
          const ts = file.updatedAt ? new Date(file.updatedAt).getTime() : NaN
          if (!Number.isFinite(ts)) return false
          if (Date.now() - ts > days * 24 * 60 * 60 * 1000) return false
        }
      }

      return true
    })
  }, [results, fileType, folder, time, folderNameById])

  const resultCount = filteredResults.length

  // Nguồn cho thẻ "Trả lời từ AI": lấy 3 tài liệu khớp ý nhất (sau khi lọc)
  const aiSources = useMemo(
    () =>
      filteredResults.slice(0, 3).map((r) => ({
        id: r.file.id,
        name: r.file.name,
        relevance: r.relevance,
      })),
    [filteredResults],
  )

  const runSearch = async (q: string) => {
    if (!q.trim()) return
    setSubmitted(true)
    setSearching(true)
    const startedAt = performance.now()
    try {
      const data = await api.aiSearch({ query: q, mode })
      const concepts: string[] = data?.matchedConcepts ?? []
      const mapped: SearchResult[] = (data?.results ?? []).map((r: any) => ({
        file: {
          ...r.file,
          owner: '',
          starred: false,
          shared: false,
          aiProcessed: true,
          tags: [],
          createdAt: r.file?.createdAt ?? new Date().toISOString(),
          updatedAt: r.file?.updatedAt ?? r.file?.createdAt ?? '',
        },
        relevance: r.relevance,
        snippet: r.snippet,
        matchedConcepts: concepts,
      }))
      setResults(mapped)
      setElapsed((performance.now() - startedAt) / 1000)
    } catch {
      setResults([])
      setElapsed(null)
    } finally {
      setSearching(false)
    }
  }

  const handleSearch = () => {
    if (!hasQuery) return
    void runSearch(query)
  }

  return (
    <div className="relative">
      <PageHeader
        eyebrow={<AIChip label={t('search.chip')} />}
        title={t('search.title')}
        subtitle={t('search.subtitle')}
      />

      {/* ===== HERO SEARCH ===== */}
      <motion.div
        variants={staggerContainer(0.08)}
        initial="hidden"
        animate="show"
        className="mx-auto max-w-3xl"
      >
        {/* Search bar */}
        <motion.div variants={fadeUpLg}>
          <div className="group relative">
            <div className="absolute -inset-0.5 rounded-3xl bg-gradient-brand opacity-20 blur-lg transition-opacity duration-500 group-focus-within:opacity-40" />
            <div className="glass-strong relative flex flex-col gap-3 rounded-3xl p-3 sm:flex-row sm:items-center">
              <div className="flex flex-1 items-center gap-3 px-2">
                <Search className="h-5 w-5 shrink-0 text-slate-400 transition-colors group-focus-within:text-grape-500" />
                <Input
                  value={query}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter') handleSearch()
                  }}
                  placeholder={t('search.placeholder')}
                  className="border-0 bg-transparent px-0 text-base focus:ring-0"
                />
                {hasQuery && (
                  <button
                    onClick={() => setQuery('')}
                    aria-label={t('search.clear')}
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Button
                size="lg"
                onClick={handleSearch}
                className="shrink-0 sm:w-auto"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Sparkles className="h-4 w-4" />
                {t('search.go')}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Example query chips */}
        <motion.div variants={fadeUp} className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <span className="mr-1 text-xs font-medium text-slate-400">{t('search.tryQuick')}</span>
          {suggestedPrompts.map((prompt) => (
            <motion.button
              key={prompt}
              onClick={() => {
                setQuery(prompt)
                void runSearch(prompt)
              }}
              whileHover={{ y: -2, scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                query === prompt
                  ? 'border-grape-300 bg-grape-50 text-grape-700'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:text-slate-900',
              )}
            >
              {prompt}
            </motion.button>
          ))}
        </motion.div>

        {/* Segmented mode control */}
        <motion.div variants={fadeUp} className="mt-5 flex justify-center">
          <div className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-surface-1/60 p-1 backdrop-blur-xl">
            {SEARCH_MODES.map((m) => {
              const Icon = m.icon
              const active = mode === m.id
              return (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={cn(
                    'relative flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors sm:text-sm',
                    active ? 'text-white' : 'text-slate-500 hover:text-slate-800',
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="search-mode-pill"
                      className="absolute inset-0 rounded-xl bg-gradient-brand shadow-glow"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon className="relative z-10 h-3.5 w-3.5" />
                  <span className="relative z-10">{t(m.key)}</span>
                </button>
              )
            })}
          </div>
        </motion.div>
      </motion.div>

      {/* ===== RESULTS ===== */}
      <AnimatePresence mode="wait">
        {submitted && hasQuery ? (
          <motion.div
            key="results"
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, y: 12 }}
            variants={staggerContainer(0.07, 0.05)}
            className="mx-auto mt-10 max-w-4xl"
          >
            {/* Result meta line */}
            <motion.div
              variants={fadeUp}
              className="mb-4 flex flex-wrap items-center justify-between gap-2"
            >
              <p className="text-sm text-slate-500">
                {elapsed != null && (
                  <>
                    {t('search.searchedIn')}{' '}
                    <span className="font-semibold text-mint-600">
                      {t('search.seconds', { n: elapsed.toFixed(2) })}
                    </span>{' '}
                    ·{' '}
                  </>
                )}
                <span className="font-semibold text-slate-900">
                  {t('search.resultCount', { n: resultCount })}
                </span>{' '}
                {t('search.for')} <span className="text-slate-700">“{query}”</span>
              </p>
              <Badge tone="ai" dot>
                {t('search.modeLabel', {
                  mode: t(SEARCH_MODES.find((m) => m.id === mode)?.key ?? 'search.modeSemantic'),
                })}
              </Badge>
            </motion.div>

            {/* Filters row */}
            <motion.div variants={fadeUp} className="mb-6 no-scrollbar -mx-1 overflow-x-auto px-1">
              <div className="flex min-w-max items-center gap-2">
                <span className="hidden items-center gap-1.5 text-xs font-semibold text-slate-400 sm:flex">
                  <Filter className="h-3.5 w-3.5" /> {t('search.filter')}
                </span>
                <FilterChip
                  icon={FileText}
                  options={FILE_TYPE_FILTERS}
                  value={fileType}
                  onChange={setFileType}
                  labelFor={(o) => (FILE_TYPE_KEYS[o] ? t(FILE_TYPE_KEYS[o]) : o)}
                />
                <FilterChip
                  icon={FolderOpen}
                  options={FOLDER_FILTERS}
                  value={folder}
                  onChange={setFolder}
                  labelFor={(o) => (FOLDER_KEYS[o] ? t(FOLDER_KEYS[o]) : o)}
                />
                <FilterChip
                  icon={Clock}
                  options={TIME_FILTERS}
                  value={time}
                  onChange={setTime}
                  labelFor={(o) => (TIME_KEYS[o] ? t(TIME_KEYS[o]) : o)}
                />
              </div>
            </motion.div>

            {/* AI Answer card */}
            {!searching && aiSources.length > 0 && (
              <motion.div variants={fadeUpLg} className="mb-6">
                <GlassCard glow className="relative overflow-hidden p-5 sm:p-6">
                  <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-grape-100 blur-3xl" />
                  <div className="relative">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <AIChip label={t('search.aiAnswer')} />
                      <span className="hidden items-center gap-1.5 text-xs text-slate-400 sm:flex">
                        <Sparkles className="h-3.5 w-3.5 text-grape-500" />
                        {t('search.synthFrom', { n: aiSources.length })}
                      </span>
                    </div>

                    <p className="text-[15px] leading-relaxed text-slate-700">
                      {t('search.aiBody', { count: aiSources.length, query })}
                    </p>

                    {/* Inline source chips */}
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium text-slate-400">{t('search.sources')}</span>
                      {aiSources.map((s) => (
                        <motion.div
                          key={s.id}
                          variants={popIn}
                          whileHover={{ y: -2 }}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 py-1 pl-2 pr-2.5 text-xs"
                        >
                          <FileText className="h-3.5 w-3.5 text-grape-500" />
                          <span className="max-w-[160px] truncate font-medium text-slate-700">{s.name}</span>
                          <span className="rounded-full bg-mint-50 px-1.5 py-0.5 text-[10px] font-bold text-mint-600">
                            {Math.round(s.relevance * 100)}%
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {/* Results list */}
            <motion.div variants={fadeUp} className="mb-3 flex items-center gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                {t('search.relatedDocs')}
              </h2>
              <span className="h-px flex-1 bg-gradient-to-r from-slate-300 to-transparent" />
            </motion.div>

            <div className="flex flex-col gap-3">
              {searching ? (
                <div className="flex items-center justify-center gap-3 py-12 text-sm text-slate-500">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-grape-500" />
                  {t('search.searching')}
                </div>
              ) : filteredResults.length > 0 ? (
                filteredResults.map((result, i) => (
                  <ResultCard
                    key={result.file.id}
                    result={result}
                    rank={i + 1}
                    folderName={folderNameById.get(result.file.folderId) ?? t('search.uncategorized')}
                  />
                ))
              ) : (
                <EmptyState
                  icon={Search}
                  title={t('search.noResultsTitle')}
                  description={t('search.noResultsDesc')}
                />
              )}
            </div>

            {/* Footer reassurance */}
            {!searching && filteredResults.length > 0 && (
              <motion.div variants={fadeUp} className="mt-8">
                <GradientFooterCta query={query} />
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial="hidden"
            animate="show"
            exit={{ opacity: 0 }}
            variants={fadeIn}
            className="mx-auto mt-12 max-w-md"
          >
            <EmptyState
              icon={Search}
              title={t('search.emptyTitle')}
              description={t('search.emptyDesc')}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ============================================================= */
/* Helpers                                                        */
/* ============================================================= */

const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.4 } },
}

function FilterChip({
  icon: Icon,
  options,
  value,
  onChange,
  labelFor,
}: {
  icon: typeof FileText
  options: string[]
  value: string
  onChange: (v: string) => void
  labelFor?: (opt: string) => string
}) {
  const [open, setOpen] = useState(false)
  const label = (opt: string) => (labelFor ? labelFor(opt) : opt)
  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
          value !== options[0]
            ? 'border-grape-300 bg-grape-50 text-grape-700'
            : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:text-slate-900',
        )}
      >
        <Icon className="h-3.5 w-3.5" />
        {label(value)}
        <ChevronRight
          className={cn('h-3 w-3 transition-transform', open ? 'rotate-90' : 'rotate-0')}
        />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <button
              className="fixed inset-0 z-10 cursor-default"
              aria-hidden
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 top-full z-20 mt-2 min-w-[150px] overflow-hidden rounded-2xl border border-slate-200 bg-surface-2/95 p-1 shadow-card backdrop-blur-xl"
            >
              {options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    onChange(opt)
                    setOpen(false)
                  }}
                  className={cn(
                    'flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-medium transition-colors',
                    opt === value
                      ? 'bg-grape-50 text-grape-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                  )}
                >
                  {label(opt)}
                  {opt === value && <Sparkles className="h-3 w-3 text-grape-500" />}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function ResultCard({
  result,
  rank,
  folderName,
}: {
  result: SearchResult
  rank: number
  folderName: string
}) {
  const t = useT()
  const { file, relevance, snippet, matchedConcepts } = result
  const pct = Math.round(relevance * 100)
  return (
    <motion.div variants={fadeUp}>
      <GlassCard interactive className="group relative overflow-hidden p-4 sm:p-5">
        <div className="flex gap-4">
          {/* File square */}
          <div className="relative shrink-0">
            <div
              className={cn(
                'grid h-14 w-14 place-items-center rounded-2xl shadow-card sm:h-16 sm:w-16',
                tone(file.tone).soft,
              )}
            >
              <FileTypeIcon type={file.type} className="relative h-7 w-7 sm:h-8 sm:w-8" />
            </div>
            <span className="absolute -left-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-surface-2 text-[10px] font-bold text-slate-600 ring-1 ring-slate-200">
              {rank}
            </span>
          </div>

          {/* Body */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="flex min-w-0 items-center gap-2 text-sm font-semibold sm:text-[15px]">
                <FileTypeIcon
                  type={file.type}
                  className={cn('hidden h-4 w-4 shrink-0 sm:block', fileTint(file.type))}
                />
                <span className="truncate text-slate-900">{file.name}</span>
              </h3>
              <Badge tone={pct >= 90 ? 'mint' : pct >= 80 ? 'ai' : 'sky'}>
                {t('search.matchPct', { n: pct })}
              </Badge>
            </div>

            {/* Snippet */}
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-500">
              <Quote className="mr-1 inline h-3 w-3 -translate-y-0.5 text-grape-400" />
              {snippet}
            </p>

            {/* Matched concepts */}
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-medium text-slate-400">{t('search.matchConcepts')}</span>
              {matchedConcepts.map((concept) => (
                <span
                  key={concept}
                  className="rounded-full border border-grape-200 bg-grape-50 px-2 py-0.5 text-[11px] font-medium text-grape-700"
                >
                  {concept}
                </span>
              ))}
            </div>

            {/* Meta + confidence */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <FolderOpen className="h-3 w-3" /> {folderName}
                </span>
                <span className="tabular-nums">{formatBytes(file.size)}</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {timeAgo(file.updatedAt)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ConfidenceMeter value={relevance} className="w-20 sm:w-24" />
                <ArrowRight className="h-4 w-4 text-slate-400 transition-all group-hover:translate-x-0.5 group-hover:text-grape-500" />
              </div>
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  )
}

function GradientFooterCta({ query }: { query: string }) {
  const t = useT()
  return (
    <motion.div variants={scaleIn}>
      <GlassCard className="relative overflow-hidden p-5 text-center sm:p-6">
        <div className="pointer-events-none absolute inset-0 bg-mesh opacity-40" />
        <div className="relative">
          <span className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-gradient-brand shadow-glow">
            <Sparkles className="h-5 w-5 text-white" />
          </span>
          <h3 className="text-base font-bold text-slate-900">{t('search.ctaTitle')}</h3>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-500">
            {t('search.ctaDesc', { query })}
          </p>
          <Button variant="secondary" size="md" className="mt-4" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Sparkles className="h-4 w-4" />
            {t('search.ctaBtn')}
          </Button>
        </div>
      </GlassCard>
    </motion.div>
  )
}