import { Link, useNavigate } from 'react-router-dom'
import {
  motion,
  type Variants,
} from 'framer-motion'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import {
  Upload,
  MessageCircleHeart,
  HardDrive,
  Files,
  Sparkles,
  Brain,
  ArrowUpRight,
  Search,
  Share2,
  ScrollText,
  Pencil,
  FolderUp,
  type LucideIcon,
  ChevronRight,
  Send,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import {
  Button,
  GlassCard,
  Badge,
  AIChip,
  ProgressBar,
} from '@/components/ui'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { FileCard } from '@/components/shared/FileCard'
import { FolderGlyph } from '@/components/ui'
import { useAuth } from '@/lib/auth'
import { useAsync } from '@/lib/useApi'
import { api } from '@/lib/api'
import type { ActivityItem, Insight, StoredFile, Folder } from '@/lib/types'
import { formatBytes, timeAgo, cn, formatNumber } from '@/lib/utils'
import {
  staggerContainer,
  fadeUp,
  fadeUpLg,
  scaleIn,
  popIn,
  hoverLift,
} from '@/lib/motion'
import { useAppContext } from '@/lib/hooks'
import { tone, type Tone } from '@/lib/theme'

/* ------------------------------------------------------------------ */
/*  Small helpers                                                      */
/* ------------------------------------------------------------------ */

const activityIconMap: Record<ActivityItem['type'], LucideIcon> = {
  upload: FolderUp,
  ai: Sparkles,
  share: Share2,
  summary: ScrollText,
  search: Search,
  edit: Pencil,
}

const activityToneMap: Record<ActivityItem['type'], Tone> = {
  upload: 'blue',
  ai: 'violet',
  share: 'emerald',
  summary: 'amber',
  search: 'indigo',
  edit: 'violet',
}

const insightIconMap: Record<string, LucideIcon> = {
  Sparkles,
  Recycle: ScrollText,
  Network: Brain,
  Clock: ScrollText,
}

/* ------------------------------------------------------------------ */
/*  Mapped data shapes (backend → view)                                */
/* ------------------------------------------------------------------ */

interface StorageSlice {
  name: string
  value: number
  color: string
}

interface UploadPoint {
  day: string
  files: number
  ai: number
}

const storageTypeColor: Record<string, string> = {
  pdf: '#4f46e5',
  doc: '#4f46e5',
  sheet: '#4f46e5',
  slide: '#4f46e5',
  image: '#e11d48',
  video: '#e11d48',
  audio: '#059669',
  code: '#f59e0b',
}
const storageTypeLabel: Record<string, string> = {
  pdf: 'Tài liệu',
  doc: 'Tài liệu',
  sheet: 'Tài liệu',
  slide: 'Tài liệu',
  image: 'Ảnh & Video',
  video: 'Ảnh & Video',
  audio: 'Âm thanh',
  code: 'Code & Khác',
}

/* Custom light tooltip for recharts ----------------------------------- */
const lightTooltip = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  color: '#0f172a',
  fontSize: 12,
  padding: '8px 12px',
  boxShadow: '0 8px 24px -12px rgba(16,24,40,0.2)',
} as const

/* ------------------------------------------------------------------ */
/*  AI prompt bar                                                      */
/* ------------------------------------------------------------------ */

function AIPromptBar({
  onAsk,
  suggestedPrompts,
}: {
  onAsk: (prompt?: string) => void
  suggestedPrompts: string[]
}) {
  return (
    <motion.div variants={fadeUpLg} initial="hidden" animate="show" className="mb-7">
      <GlassCard
        glow
        className="overflow-hidden p-0"
      >
        <div className="relative">
          {/* glow blob */}
          <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-grape-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-candy-500/10 blur-3xl" />

          <button
            onClick={() => onAsk()}
            className="group relative flex w-full items-center gap-3 px-4 py-4 text-left sm:px-5"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-brand shadow-glow">
              <motion.span
                animate={{ rotate: [0, 16, -10, 0], scale: [1, 1.15, 1] }}
                transition={{ duration: 2.6, repeat: Infinity }}
              >
                <Sparkles className="h-5 w-5 text-white" />
              </motion.span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="hidden sm:inline">
                  <AIChip label="CloudMind AI" />
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400 sm:hidden">
                  CloudMind AI
                </span>
              </span>
              <span className="mt-1 block truncate text-sm text-slate-500 sm:text-base">
                Hỏi bất cứ điều gì về tài liệu của bạn...
              </span>
            </span>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-slate-100 transition-colors group-hover:bg-slate-200">
              <Send className="h-4 w-4 text-slate-700" />
            </span>
          </button>

          {/* suggested prompt chips */}
          <motion.div
            variants={staggerContainer(0.05, 0.1)}
            initial="hidden"
            animate="show"
            className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-4 sm:flex-wrap sm:px-5"
          >
            {suggestedPrompts.map((p) => (
              <motion.button
                key={p}
                variants={popIn}
                onClick={() => onAsk(p)}
                whileHover={{ y: -2, scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-grape-500/40 hover:bg-grape-500/10 hover:text-slate-900"
              >
                {p}
              </motion.button>
            ))}
          </motion.div>
        </div>
      </GlassCard>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  Storage breakdown card                                             */
/* ------------------------------------------------------------------ */

function StorageCard({
  storageUsed,
  storageTotal,
  storagePct,
  plan,
  storageBreakdown,
}: {
  storageUsed: number
  storageTotal: number
  storagePct: number
  plan: string
  storageBreakdown: StorageSlice[]
}) {
  const usedGB = (storageUsed / 1024 ** 3).toFixed(1)
  const totalGB = (storageTotal / 1024 ** 3).toFixed(0)

  return (
    <motion.div variants={fadeUp}>
      <GlassCard className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Dung lượng</h3>
            <p className="mt-0.5 text-xs text-slate-400">
              {usedGB} GB / {totalGB} GB đã dùng
            </p>
          </div>
          <Badge tone="brand">{plan}</Badge>
        </div>

        <div className="relative mx-auto mt-2 h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={storageBreakdown}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={74}
                paddingAngle={3}
                stroke="none"
                startAngle={90}
                endAngle={-270}
              >
                {storageBreakdown.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={lightTooltip}
                formatter={(value: number, name: string) => [`${value} GB`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* center label */}
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="text-center">
              <p className="text-2xl font-extrabold tracking-tight text-slate-900">{storagePct}%</p>
              <p className="text-[11px] text-slate-400">đã dùng</p>
            </div>
          </div>
        </div>

        {/* legend */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          {storageBreakdown.map((s) => (
            <div key={s.name} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: s.color }}
              />
              <span className="truncate text-xs text-slate-600">{s.name}</span>
              <span className="ml-auto text-xs font-semibold tabular-nums text-slate-400">
                {s.value} GB
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <ProgressBar progress={storagePct} gradient="from-grape-500 to-candy-500" />
          <p className="mt-2 text-[11px] text-slate-400">
            Còn {formatBytes(Math.max(storageTotal - storageUsed, 0), 0)} trống.
            Nâng cấp để có thêm không gian nhé 💜
          </p>
        </div>
      </GlassCard>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  Activity timeline card                                            */
/* ------------------------------------------------------------------ */

function ActivityCard({ activity }: { activity: ActivityItem[] }) {
  return (
    <motion.div variants={fadeUp}>
      <GlassCard className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Hoạt động</h3>
          <Badge tone="mint" dot>
            Live
          </Badge>
        </div>

        <motion.div
          variants={staggerContainer(0.06)}
          initial="hidden"
          animate="show"
          className="relative"
        >
          {/* vertical line */}
          <span className="absolute left-[18px] top-2 bottom-2 w-px bg-slate-200" />
          {activity.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-400">
              Chưa có hoạt động nào — bắt đầu tải tài liệu lên nhé! ✨
            </p>
          )}
          <ul className="space-y-1">
            {activity.map((item) => {
              const Icon = activityIconMap[item.type]
              return (
                <motion.li
                  key={item.id}
                  variants={fadeUp}
                  className="relative flex gap-3 rounded-2xl p-2 transition-colors hover:bg-slate-50"
                >
                  <span
                    className={cn(
                      'relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-xl shadow-card',
                      tone(activityToneMap[item.type]).soft,
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold leading-snug text-slate-800">
                      {item.title}
                    </p>
                    <p className="truncate text-xs text-slate-400">{item.detail}</p>
                  </div>
                  <span className="shrink-0 whitespace-nowrap text-[11px] text-slate-400">
                    {timeAgo(item.timestamp)}
                  </span>
                </motion.li>
              )
            })}
          </ul>
        </motion.div>
      </GlassCard>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  Weekly activity area chart                                         */
/* ------------------------------------------------------------------ */

function WeeklyActivityCard({ uploadActivity }: { uploadActivity: UploadPoint[] }) {
  const totalUploads = uploadActivity.reduce((acc, d) => acc + d.files, 0)
  const totalAI = uploadActivity.reduce((acc, d) => acc + d.ai, 0)

  return (
    <motion.div variants={fadeUp}>
      <GlassCard className="p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Nhịp hoạt động tuần này 📈</h3>
            <p className="mt-0.5 text-xs text-slate-400">
              File tải lên và lượt xử lý AI theo ngày
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-ink-400" />
              <span className="text-slate-600">Tải lên</span>
              <span className="font-bold tabular-nums text-slate-800">{totalUploads}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-candy-400" />
              <span className="text-slate-600">AI xử lý</span>
              <span className="font-bold tabular-nums text-slate-800">{totalAI}</span>
            </span>
          </div>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={uploadActivity} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
              <defs>
                <linearGradient id="gradFiles" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gradAI" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e11d48" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#e11d48" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="day"
                stroke="#94a3b8"
                tick={{ fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
                fontSize={12}
              />
              <YAxis
                stroke="#94a3b8"
                tick={{ fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
                fontSize={12}
                width={42}
              />
              <Tooltip
                contentStyle={lightTooltip}
                cursor={{ stroke: '#cbd5e1' }}
              />
              <Area
                type="monotone"
                dataKey="files"
                name="Tải lên"
                stroke="#4f46e5"
                strokeWidth={2.5}
                fill="url(#gradFiles)"
              />
              <Area
                type="monotone"
                dataKey="ai"
                name="AI xử lý"
                stroke="#e11d48"
                strokeWidth={2.5}
                fill="url(#gradAI)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  Insight teaser card                                                */
/* ------------------------------------------------------------------ */

function InsightTeaser({ insight }: { insight: Insight }) {
  const Icon = insightIconMap[insight.icon] ?? Sparkles
  const up = insight.trend >= 0
  return (
    <motion.div variants={fadeUp} {...hoverLift}>
      <Link to="/app/insights" className="block h-full">
        <GlassCard interactive className="h-full overflow-hidden p-5">
          <div
            className={cn(
              'pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-50 blur-2xl',
              tone(insight.tone).soft,
            )}
          />
          <div className="relative flex items-start justify-between">
            <span
              className={cn(
                'grid h-11 w-11 place-items-center rounded-2xl shadow-card',
                tone(insight.tone).soft,
              )}
            >
              <Icon className="h-5 w-5" />
            </span>
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold',
                up ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600',
              )}
            >
              {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(insight.trend)}%
            </span>
          </div>
          <h4 className="mt-4 text-sm font-bold leading-snug text-slate-900">{insight.title}</h4>
          <p className="mt-1.5 line-clamp-2 text-xs text-slate-500">{insight.description}</p>
          <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-grape-600">
            Khám phá <ChevronRight className="h-3.5 w-3.5" />
          </span>
        </GlassCard>
      </Link>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export function DashboardPage() {
  const { openUpload } = useAppContext()
  const { user } = useAuth()
  const navigate = useNavigate()

  const userName = user?.name ?? ''

  // Tải song song mọi dữ liệu dashboard.
  const { data, loading } = useAsync(
    () =>
      Promise.all([
        api.dashboardStats(),
        api.files({ limit: 6, sort: 'updatedAt' }).then((r) => r.items),
        api.folders(),
        api.activity(),
        api.storageBreakdown(),
        api.activityChart(),
        api.insights(),
        api.aiSuggestions(),
      ]).then(([stats, recent, foldersData, act, breakdown, chart, ins, suggest]) => ({
        stats,
        recent,
        foldersData,
        act,
        breakdown,
        chart,
        ins,
        suggest,
      })),
    [],
  )

  const goChat = () => navigate('/app/chat')

  const sectionFade: Variants = fadeUp

  // ----- map shape backend → mock cũ (an toàn với optional chaining) -----
  const stats = data?.stats

  const recentFiles: StoredFile[] = (data?.recent ?? []).map((f: any) => ({
    id: f.id,
    name: f.name,
    type: f.type,
    size: f.size,
    folderId: f.folderId,
    createdAt: f.createdAt,
    updatedAt: f.updatedAt,
    owner: userName,
    starred: f.starred ?? false,
    shared: f.shared ?? false,
    aiProcessed: f.aiProcessed ?? false,
    aiSummary: f.aiSummary,
    tags: f.tags ?? [],
    tone: f.tone,
  }))

  const folders: Folder[] = data?.foldersData ?? []

  const activity: ActivityItem[] = (data?.act ?? []).map(
    (a: any, i: number): ActivityItem => ({
      id: String(i),
      type: a.type === 'chat' ? 'ai' : a.type,
      title: a.message,
      detail: '',
      timestamp: a.at,
    }),
  )

  const storageBreakdown: StorageSlice[] = (data?.breakdown ?? []).map((b: any) => ({
    name: storageTypeLabel[b.type] ?? 'Khác',
    value: Number((b.size / 1024 ** 3).toFixed(1)),
    color: storageTypeColor[b.type] ?? '#f59e0b',
  }))

  const uploadActivity: UploadPoint[] = (data?.chart ?? []).map((c: any) => ({
    day: c.day,
    files: c.uploads,
    ai: c.ai,
  }))

  const insights: Insight[] = (data?.ins ?? []).map((i: any) => ({
    id: i.id,
    title: i.title,
    description: i.description,
    icon: i.icon,
    tone: i.tone,
    trend: i.trend ?? 0,
  }))

  const suggestedPrompts: string[] = data?.suggest?.suggestions ?? []

  const storageUsed = stats?.storage?.used ?? user?.storageUsed ?? 0
  const storageTotal = stats?.storage?.total ?? user?.storageTotal ?? 0
  const storagePct =
    stats?.storage?.percent ??
    (storageTotal > 0 ? Math.round((storageUsed / storageTotal) * 100) : 0)
  const totalFiles = stats?.totalFiles ?? 0
  const aiInteractions = stats?.aiInteractions ?? 0
  const knowledgeClustersCount = stats?.knowledgeClusters ?? 0
  const plan = user?.plan ?? 'Free'

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-500" />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        eyebrow={
          <Badge tone="ai">
            <Sparkles className="h-3 w-3" /> Bảng điều khiển
          </Badge>
        }
        title={`Chào buổi sáng, ${userName} 👋`}
        subtitle="AI đã tóm tắt 3 tài liệu và phát hiện 2 cụm tri thức mới qua đêm. Bắt đầu một ngày năng suất nào! ✨"
        actions={
          <>
            <Button variant="primary" onClick={openUpload}>
              <Upload className="h-4 w-4" /> Tải lên
            </Button>
            <Button variant="glass" onClick={goChat}>
              <MessageCircleHeart className="h-4 w-4" /> Hỏi AI
            </Button>
          </>
        }
      />

      {/* AI prompt bar */}
      <AIPromptBar onAsk={goChat} suggestedPrompts={suggestedPrompts} />

      {/* Stat row */}
      <motion.div
        variants={staggerContainer(0.08)}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          icon={HardDrive}
          label="Dung lượng đã dùng"
          value={formatBytes(storageUsed, 0)}
          suffix={`/ ${formatBytes(storageTotal, 0)}`}
          trend={9}
          tone="violet"
        />
        <StatCard
          icon={Files}
          label="Tổng tài liệu"
          value={formatNumber(totalFiles)}
          trend={14}
          tone="blue"
        />
        <StatCard
          icon={Sparkles}
          label="Lượt AI tuần này"
          value={formatNumber(aiInteractions)}
          trend={32}
          tone="emerald"
        />
        <StatCard
          icon={Brain}
          label="Tri thức khám phá"
          value={formatNumber(knowledgeClustersCount)}
          suffix="cụm"
          trend={12}
          tone="amber"
        />
      </motion.div>

      {/* Two-column layout */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* LEFT (2fr) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Recent files */}
          <motion.div variants={sectionFade} initial="hidden" animate="show">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Tài liệu gần đây</h2>
              <Link
                to="/app/files"
                className="inline-flex items-center gap-1 text-sm font-semibold text-grape-600 transition-colors hover:text-grape-500"
              >
                Xem tất cả <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
            {recentFiles.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">
                Chưa có tài liệu nào — hãy tải lên! 📄
              </p>
            ) : (
              <motion.div
                variants={staggerContainer(0.07)}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
              >
                {recentFiles.map((file) => (
                  <FileCard
                    key={file.id}
                    file={file}
                    onClick={() => navigate('/app/files')}
                  />
                ))}
              </motion.div>
            )}
          </motion.div>

          {/* Folders quick access */}
          <motion.div variants={sectionFade} initial="hidden" animate="show">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Thư mục</h2>
              <Link
                to="/app/files"
                className="inline-flex items-center gap-1 text-sm font-semibold text-grape-600 transition-colors hover:text-grape-500"
              >
                Quản lý <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
            {folders.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">
                Chưa có thư mục nào — tạo thư mục đầu tiên nhé! 📁
              </p>
            ) : (
            <motion.div
              variants={staggerContainer(0.05)}
              initial="hidden"
              animate="show"
              className="grid grid-cols-2 gap-3 sm:grid-cols-3"
            >
              {folders.map((folder) => (
                <motion.button
                  key={folder.id}
                  variants={scaleIn}
                  onClick={() => navigate('/app/files')}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.97 }}
                  className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left transition-colors hover:border-slate-300 hover:bg-slate-100"
                >
                  <span
                    className={cn(
                      'grid h-10 w-10 shrink-0 place-items-center rounded-xl shadow-card',
                      tone(folder.tone).soft,
                    )}
                  >
                    <FolderGlyph name={folder.icon} className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-slate-800">
                      {folder.name}
                    </span>
                    <span className="block text-xs text-slate-400">
                      {folder.fileCount} mục · {formatBytes(folder.size, 0)}
                    </span>
                  </span>
                </motion.button>
              ))}
            </motion.div>
            )}
          </motion.div>

          {/* Weekly activity chart */}
          <motion.div variants={staggerContainer()} initial="hidden" animate="show">
            <WeeklyActivityCard uploadActivity={uploadActivity} />
          </motion.div>
        </div>

        {/* RIGHT (1fr) */}
        <motion.div
          variants={staggerContainer(0.1)}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          <StorageCard
            storageUsed={storageUsed}
            storageTotal={storageTotal}
            storagePct={storagePct}
            plan={plan}
            storageBreakdown={storageBreakdown}
          />
          <ActivityCard activity={activity} />
        </motion.div>
      </div>

      {/* Insights teaser strip */}
      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Brain className="h-5 w-5 text-grape-600" /> Insights cho bạn
          </h2>
          <Link
            to="/app/insights"
            className="inline-flex items-center gap-1 text-sm font-semibold text-grape-600 transition-colors hover:text-grape-500"
          >
            Tất cả insights <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        <motion.div
          variants={staggerContainer(0.08)}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {insights.slice(0, 3).map((insight) => (
            <InsightTeaser key={insight.id} insight={insight} />
          ))}
        </motion.div>
      </div>
    </div>
  )
}