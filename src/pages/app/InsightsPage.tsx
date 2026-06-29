import { useMemo, useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import {
  Sparkles,
  Recycle,
  Network,
  Clock,
  TrendingUp,
  TrendingDown,
  Link2,
  ArrowUpRight,
  Lightbulb,
  BookOpen,
  Merge,
  Flame,
  Brain,
  type LucideIcon,
} from 'lucide-react'
import { GlassCard, Badge, Button, AIChip, ConfidenceMeter, FileTypeIcon } from '@/components/ui'
import { PageHeader } from '@/components/shared/PageHeader'
import { api } from '@/lib/api'
import { useAsync } from '@/lib/useApi'
import type { Insight, FileType } from '@/lib/types'
import { cn } from '@/lib/utils'
import { tone, type Tone } from '@/lib/theme'
import { staggerContainer, fadeUp, fadeUpLg, scaleIn, popIn, spring } from '@/lib/motion'

/* ------------------------------------------------------------------ */
/* Local helpers & invented data                                       */
/* ------------------------------------------------------------------ */

const insightIcons: Record<string, LucideIcon> = {
  Sparkles,
  Recycle,
  Network,
  Clock,
}

type TopicTrendPoint = {
  month: string
  ai: number
  design: number
  finance: number
}

const topicTrends: TopicTrendPoint[] = [
  { month: 'T1', ai: 12, design: 8, finance: 5 },
  { month: 'T2', ai: 18, design: 11, finance: 6 },
  { month: 'T3', ai: 24, design: 9, finance: 9 },
  { month: 'T4', ai: 31, design: 14, finance: 8 },
  { month: 'T5', ai: 38, design: 16, finance: 12 },
  { month: 'T6', ai: 47, design: 14, finance: 11 },
]

type TopicMeta = { key: keyof Omit<TopicTrendPoint, 'month'>; label: string; color: string }
const topicMeta: TopicMeta[] = [
  { key: 'ai', label: 'AI & Cloud', color: '#7c3aed' },
  { key: 'design', label: 'Thiết kế', color: '#e11d48' },
  { key: 'finance', label: 'Tài chính', color: '#059669' },
]

/** Một file liên quan trong kết nối (từ backend: { id, name }). */
type ConnectionFile = { id: string; name: string; type: FileType; tone: Tone }

type Connection = {
  id: string
  title: string
  reason: string
  confidence: number
  files: ConnectionFile[]
  tone: Tone
}

/** Cụm tri thức trên bản đồ (khớp backend insightClusters). */
type KnowledgeCluster = {
  id: string
  label: string
  files: number
  color: string
  x: number
  y: number
}

const connectionTones: Tone[] = ['indigo', 'emerald', 'rose', 'blue']

type Recommendation = {
  id: string
  kind: string
  icon: LucideIcon
  title: string
  description: string
  cta: string
  tone: Tone
  badgeTone: 'brand' | 'mint' | 'candy' | 'sun'
}

const recommendations: Recommendation[] = [
  {
    id: 'rc1',
    kind: 'Nên đọc lại',
    icon: BookOpen,
    title: 'Atomic Habits đang phủ bụi 📚',
    description: 'Bạn đánh dấu sao nhưng chưa mở lại 3 tháng. AI gợi ý lướt lại 5 ý chính trong 4 phút.',
    cta: 'Tóm tắt nhanh',
    tone: 'violet',
    badgeTone: 'brand',
  },
  {
    id: 'rc2',
    kind: 'Có thể gộp',
    icon: Merge,
    title: '14 file trùng + 6 bản nháp',
    description: 'Các slide "v3 final FINAL" và bản nháp cũ có thể gộp lại, giải phóng ~2.4 GB.',
    cta: 'Xem & gộp',
    tone: 'emerald',
    badgeTone: 'mint',
  },
  {
    id: 'rc3',
    kind: 'Chủ đề đang lên',
    icon: Flame,
    title: 'AI & Cloud bùng nổ +47%',
    description: 'Chủ đề này chiếm 42% tài liệu mới tháng này. Tạo một cụm tri thức riêng để gom hết lại nhé?',
    cta: 'Tạo cụm tri thức',
    tone: 'amber',
    badgeTone: 'sun',
  },
]

/* ------------------------------------------------------------------ */
/* Subcomponents                                                       */
/* ------------------------------------------------------------------ */

function TrendChip({ trend }: { trend: number }) {
  const up = trend >= 0
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold',
        up ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600',
      )}
    >
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {up ? '+' : ''}
      {trend}%
    </span>
  )
}

function InsightCard({ insight }: { insight: Insight }) {
  const Icon = insightIcons[insight.icon] ?? Sparkles
  return (
    <GlassCard
      variants={fadeUp}
      interactive
      glow
      className="group flex h-full flex-col gap-4 p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6',
            tone(insight.tone).soft,
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <TrendChip trend={insight.trend} />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-base font-bold leading-snug text-slate-900">{insight.title}</h3>
        <p className="text-sm leading-relaxed text-slate-500">{insight.description}</p>
      </div>
    </GlassCard>
  )
}

function ConnectionCard({ connection }: { connection: Connection }) {
  const relatedFiles = connection.files
  return (
    <GlassCard variants={fadeUp} interactive className="flex h-full flex-col gap-4 p-5">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-xl',
            tone(connection.tone).soft,
          )}
        >
          <Link2 className="h-4 w-4" />
        </span>
        <Badge tone="ai" dot>
          AI đã phát hiện
        </Badge>
      </div>

      <h3 className="text-[15px] font-bold leading-snug text-slate-900">{connection.title}</h3>
      <p className="text-sm leading-relaxed text-slate-500">{connection.reason}</p>

      <div className="flex flex-wrap gap-2">
        {relatedFiles.map((file) => (
          <span
            key={file.id}
            className="inline-flex max-w-[180px] items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 py-1 pl-1.5 pr-2.5 text-xs text-slate-600"
          >
            <span
              className={cn(
                'flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                tone(file.tone).soft,
              )}
            >
              <FileTypeIcon type={file.type} className="h-2.5 w-2.5" />
            </span>
            <span className="truncate">{file.name}</span>
          </span>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-200 pt-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            Độ tự tin
          </span>
          <ConfidenceMeter value={connection.confidence} />
        </div>
        <Button variant="ghost" size="sm" className="shrink-0">
          Khám phá
          <ArrowUpRight className="ml-0.5 h-3.5 w-3.5" />
        </Button>
      </div>
    </GlassCard>
  )
}

function RecommendationCard({ rec }: { rec: Recommendation }) {
  const Icon = rec.icon
  return (
    <GlassCard variants={fadeUp} interactive glow className="relative flex h-full flex-col gap-4 overflow-hidden p-5">
      <div className="relative flex items-center gap-3">
        <span
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-2xl',
            tone(rec.tone).soft,
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
        <Badge tone={rec.badgeTone}>{rec.kind}</Badge>
      </div>
      <div className="relative space-y-1.5">
        <h3 className="text-base font-bold leading-snug text-slate-900">{rec.title}</h3>
        <p className="text-sm leading-relaxed text-slate-500">{rec.description}</p>
      </div>
      <Button
        variant="glass"
        size="sm"
        className="relative mt-auto w-full justify-center"
        whileHover={{ scale: 1.02 }}
      >
        {rec.cta}
      </Button>
    </GlassCard>
  )
}

/* ------------------------------------------------------------------ */
/* Knowledge graph                                                     */
/* ------------------------------------------------------------------ */

function KnowledgeGraph({ knowledgeClusters }: { knowledgeClusters: KnowledgeCluster[] }) {
  const [hovered, setHovered] = useState<string | null>(null)
  const center = useMemo(
    () => knowledgeClusters.find((c) => c.id === 'kc5') ?? knowledgeClusters[0],
    [knowledgeClusters],
  )
  const maxFiles = useMemo(
    () => Math.max(1, ...knowledgeClusters.map((c) => c.files)),
    [knowledgeClusters],
  )

  return (
    <GlassCard variants={fadeUpLg} glow className="overflow-hidden p-5 sm:p-6">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-violet-500" />
          <h2 className="text-lg font-bold text-slate-900">Bản đồ tri thức</h2>
          <AIChip label="Live" />
        </div>
        <p className="text-sm text-slate-500">
          {knowledgeClusters.length} cụm chủ đề · {knowledgeClusters.reduce((s, c) => s + c.files, 0)} tài liệu
        </p>
      </div>

      <div className="relative h-[360px] w-full overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 bg-mesh">
        {/* connection lines from central cluster */}
        <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
          {knowledgeClusters
            .filter((c) => c.id !== center.id)
            .map((c) => {
              const active = hovered === null || hovered === c.id || hovered === center.id
              return (
                <motion.line
                  key={c.id}
                  x1={`${center.x}%`}
                  y1={`${center.y}%`}
                  x2={`${c.x}%`}
                  y2={`${c.y}%`}
                  stroke="#cbd5e1"
                  strokeWidth={active ? 1.5 : 1}
                  strokeOpacity={active ? 0.7 : 0.3}
                  strokeDasharray="4 6"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1.1, ease: 'easeOut' }}
                />
              )
            })}
        </svg>

        {/* nodes */}
        {knowledgeClusters.map((c, i) => {
          const isCenter = c.id === center.id
          const ratio = c.files / maxFiles
          const size = 56 + ratio * 64 // 56..120 px
          const active = hovered === null || hovered === c.id
          return (
            <motion.button
              key={c.id}
              type="button"
              onMouseEnter={() => setHovered(c.id)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(c.id)}
              onBlur={() => setHovered(null)}
              className="group absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full text-center outline-none ring-focus"
              style={{ left: `${c.x}%`, top: `${c.y}%`, width: size, height: size }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: active ? 1 : 0.45, scale: 1 }}
              transition={{ ...spring, delay: 0.15 + i * 0.08 }}
              whileHover={{ scale: 1.12, zIndex: 20 }}
              whileTap={{ scale: 0.96 }}
            >
              <span
                className={cn(
                  'animate-float-slow absolute inset-0 rounded-full border backdrop-blur-md',
                  isCenter ? 'border-slate-300' : 'border-slate-200',
                )}
                style={{
                  animationDelay: `${i * 0.5}s`,
                  backgroundColor: `${c.color}1f`,
                  boxShadow: `0 0 ${isCenter ? 36 : 22}px ${c.color}${isCenter ? '3d' : '2e'}`,
                }}
              />
              <span
                className="relative z-10 rounded-full"
                style={{
                  width: Math.max(10, size * 0.18),
                  height: Math.max(10, size * 0.18),
                  backgroundColor: c.color,
                  boxShadow: `0 0 12px ${c.color}55`,
                }}
              />
              <span className="relative z-10 mt-1 max-w-[110px] truncate px-1 text-[11px] font-bold leading-tight text-slate-700 sm:text-xs">
                {c.label}
              </span>
              <span className="relative z-10 text-[10px] font-semibold text-slate-500">
                {c.files} file
              </span>
            </motion.button>
          )
        })}
      </div>

      {/* legend */}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        {knowledgeClusters.map((c) => (
          <button
            key={c.id}
            type="button"
            onMouseEnter={() => setHovered(c.id)}
            onMouseLeave={() => setHovered(null)}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-2 py-1 text-xs transition-colors',
              hovered === c.id ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700',
            )}
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: c.color, boxShadow: `0 0 8px ${c.color}55` }}
            />
            {c.label}
          </button>
        ))}
      </div>
    </GlassCard>
  )
}

/* ------------------------------------------------------------------ */
/* Topic trends chart                                                  */
/* ------------------------------------------------------------------ */

type TooltipPayloadItem = {
  name?: string
  value?: number | string
  color?: string
  dataKey?: string | number
}

function TrendTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string | number
}) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        color: '#0f172a',
        padding: '10px 12px',
        boxShadow: '0 8px 24px -12px rgba(16,24,40,0.2)',
      }}
    >
      <p className="mb-1.5 text-xs font-bold text-slate-700">Tháng {label}</p>
      <div className="space-y-1">
        {payload.map((item) => (
          <div key={String(item.dataKey)} className="flex items-center gap-2 text-xs">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-slate-500">{item.name}</span>
            <span className="ml-auto font-bold tabular-nums text-slate-900">{item.value} file</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TopicTrends() {
  return (
    <GlassCard variants={fadeUpLg} className="p-5 sm:p-6">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            <h2 className="text-lg font-bold text-slate-900">Xu hướng chủ đề</h2>
          </div>
          <p className="mt-0.5 text-sm text-slate-500">Số tài liệu mới theo chủ đề · 6 tháng gần nhất</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {topicMeta.map((t) => (
            <span key={t.key} className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: t.color }} />
              {t.label}
            </span>
          ))}
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={topicTrends} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              {topicMeta.map((t) => (
                <linearGradient key={t.key} id={`grad-${t.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={t.color} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={t.color} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="month"
              stroke="#94a3b8"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: '#94a3b8' }}
            />
            <YAxis
              stroke="#94a3b8"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: '#94a3b8' }}
              width={36}
            />
            <Tooltip content={<TrendTooltip />} cursor={{ stroke: '#cbd5e1' }} />
            {topicMeta.map((t) => (
              <Area
                key={t.key}
                type="monotone"
                dataKey={t.key}
                name={t.label}
                stroke={t.color}
                strokeWidth={2.5}
                fill={`url(#grad-${t.key})`}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function Spinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-500" />
    </div>
  )
}

function EmptyMessage({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
      {children}
    </div>
  )
}

export function InsightsPage() {
  const { data: insightsData, loading: insightsLoading } = useAsync(
    () => api.insights() as Promise<Insight[]>,
    [],
  )
  const insights: Insight[] = (insightsData ?? []).map((i) => ({ ...i, trend: i.trend ?? 0 }))

  const { data: clustersData, loading: clustersLoading } = useAsync(
    () => api.insightClusters() as Promise<KnowledgeCluster[]>,
    [],
  )
  const knowledgeClusters: KnowledgeCluster[] = clustersData ?? []

  const { data: connectionsData, loading: connectionsLoading } = useAsync(
    () =>
      api.insightConnections() as Promise<
        { id: string; label: string; files: { id: string; name: string }[]; confidence: number }[]
      >,
    [],
  )
  const connections: Connection[] = (connectionsData ?? []).map((c, idx) => {
    const t = connectionTones[idx % connectionTones.length]
    return {
      id: c.id,
      title: c.label,
      reason: '',
      confidence: c.confidence ?? 0,
      tone: t,
      files: (c.files ?? []).map((f) => ({ id: f.id, name: f.name, type: 'doc' as FileType, tone: t })),
    }
  })

  return (
    <div className="space-y-8 pb-16">
      <PageHeader
        eyebrow={<Badge tone="ai" dot>Khai thác tri thức</Badge>}
        title="Khai thác tri thức"
        subtitle="AI lục tung kho file của bạn, nối các mảnh ghép rời rạc thành những kết nối bất ngờ — não thứ hai chính thức online ✨"
        actions={
          <Button variant="primary" size="md" whileHover={{ scale: 1.03 }}>
            <Sparkles className="mr-1.5 h-4 w-4" />
            Quét lại toàn bộ
          </Button>
        }
      />

      {/* Knowledge graph */}
      <motion.div variants={staggerContainer()} initial="hidden" animate="show">
        {clustersLoading ? (
          <Spinner />
        ) : knowledgeClusters.length === 0 ? (
          <EmptyMessage>Chưa có cụm tri thức nào — hãy tải thêm tài liệu để AI dệt bản đồ nhé!</EmptyMessage>
        ) : (
          <KnowledgeGraph knowledgeClusters={knowledgeClusters} />
        )}
      </motion.div>

      {/* Insight cards */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-bold text-slate-900">Phát hiện nổi bật</h2>
        </div>
        {insightsLoading ? (
          <Spinner />
        ) : insights.length === 0 ? (
          <EmptyMessage>Chưa có phát hiện nào — AI sẽ học dần khi bạn dùng nhiều hơn ✨</EmptyMessage>
        ) : (
          <motion.div
            variants={staggerContainer()}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {insights.map((insight: Insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </motion.div>
        )}
      </section>

      {/* Topic trends */}
      <motion.div variants={staggerContainer()} initial="hidden" animate="show">
        <TopicTrends />
      </motion.div>

      {/* Discovered connections */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Network className="h-5 w-5 text-violet-500" />
            <h2 className="text-lg font-bold text-slate-900">Kết nối vừa phát hiện</h2>
          </div>
          <Badge tone="ai">{connections.length} mối liên hệ</Badge>
        </div>
        {connectionsLoading ? (
          <Spinner />
        ) : connections.length === 0 ? (
          <EmptyMessage>Chưa phát hiện kết nối nào — thêm tài liệu để AI nối các mảnh ghép nhé!</EmptyMessage>
        ) : (
          <motion.div
            variants={staggerContainer()}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
          >
            {connections.map((connection) => (
              <ConnectionCard key={connection.id} connection={connection} />
            ))}
          </motion.div>
        )}
      </section>

      {/* Recommendations */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-rose-500" />
          <h2 className="text-lg font-bold text-slate-900">Gợi ý cho bạn</h2>
        </div>
        <motion.div
          variants={staggerContainer()}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {recommendations.map((rec) => (
            <RecommendationCard key={rec.id} rec={rec} />
          ))}
        </motion.div>
      </section>

      {/* footer flourish */}
      <motion.div
        variants={scaleIn}
        initial="hidden"
        animate="show"
        className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center"
      >
        <motion.span variants={popIn} className="inline-flex">
          <Badge tone="ai" dot>
            Đang học liên tục
          </Badge>
        </motion.span>
        <p className="max-w-md text-sm text-slate-500">
          Càng dùng nhiều, AI càng hiểu bạn. Mỗi file mới là một mảnh ghép để bản đồ tri thức thêm sáng 🌌
        </p>
      </motion.div>
    </div>
  )
}

// Keep FileType referenced for type-import clarity in strict builds.
export type { FileType }
