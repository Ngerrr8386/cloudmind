import { useEffect, useRef, useState } from 'react'
import type { ComponentType } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  User,
  CreditCard,
  HardDrive,
  Sparkles,
  Palette,
  ShieldCheck,
  Camera,
  Crown,
  ArrowUpRight,
  Download,
  CheckCircle2,
  Wand2,
  FolderTree,
  ScanSearch,
  FlaskConical,
  Moon,
  Sun,
  Monitor,
  Smartphone,
  Laptop,
  Tablet,
  KeyRound,
  LogOut,
  Check,
  type LucideIcon,
} from 'lucide-react'
import { Button, Badge, GlassCard, Avatar, Input, Toggle, ProgressRing } from '@/components/ui'
import { PageHeader } from '@/components/shared/PageHeader'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { useAsync } from '@/lib/useApi'
import { cn, formatBytes } from '@/lib/utils'
import { staggerContainer, fadeUp, fadeUpLg } from '@/lib/motion'

const STORAGE_COLORS: Record<string, string> = {
  pdf: '#4f46e5',
  doc: '#4f46e5',
  sheet: '#4f46e5',
  slide: '#4f46e5',
  note: '#4f46e5',
  image: '#e11d48',
  video: '#e11d48',
  audio: '#059669',
  code: '#f59e0b',
  archive: '#f59e0b',
}

const STORAGE_LABELS: Record<string, string> = {
  pdf: 'PDF',
  doc: 'Tài liệu',
  sheet: 'Bảng tính',
  slide: 'Trình chiếu',
  note: 'Ghi chú',
  image: 'Hình ảnh',
  video: 'Video',
  audio: 'Âm thanh',
  code: 'Code',
  archive: 'Lưu trữ',
}

type TabId = 'profile' | 'billing' | 'storage' | 'ai' | 'appearance' | 'security'

interface TabDef {
  id: TabId
  label: string
  icon: LucideIcon
  hint: string
}

const TABS: TabDef[] = [
  { id: 'profile', label: 'Hồ sơ', icon: User, hint: 'Thông tin của bạn' },
  { id: 'billing', label: 'Gói & Thanh toán', icon: CreditCard, hint: 'Gói Pro đang chạy' },
  { id: 'storage', label: 'Lưu trữ', icon: HardDrive, hint: 'Dung lượng đã dùng' },
  { id: 'ai', label: 'AI & Quyền riêng tư', icon: Sparkles, hint: 'Kiểm soát AI' },
  { id: 'appearance', label: 'Giao diện', icon: Palette, hint: 'Theme & màu nhấn' },
  { id: 'security', label: 'Bảo mật', icon: ShieldCheck, hint: 'Khoá chặt tài khoản' },
]

const tabContent = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.2 } },
}

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('profile')

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        eyebrow={<Badge tone="brand" dot>Trung tâm điều khiển</Badge>}
        title="Cài đặt"
        subtitle="Chỉnh CloudMind cho đúng gu của bạn — từ hồ sơ, gói cước tới mức độ AI được phép nhúng tay vào ✨"
      />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Desktop vertical tab nav */}
        <aside className="hidden shrink-0 lg:block lg:w-64">
          <motion.div
            variants={staggerContainer(0.05)}
            initial="hidden"
            animate="show"
            className="sticky top-24 flex flex-col gap-1.5"
          >
            {TABS.map((tab) => {
              const active = tab.id === activeTab
              return (
                <motion.button
                  key={tab.id}
                  variants={fadeUp}
                  onClick={() => setActiveTab(tab.id)}
                  whileHover={{ x: active ? 0 : 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-2xl px-3.5 py-3 text-left ring-focus transition-colors',
                    active ? 'glass-strong text-slate-900' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100',
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="settings-tab-active"
                      className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-full bg-gradient-brand"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span
                    className={cn(
                      'grid h-9 w-9 shrink-0 place-items-center rounded-xl transition-colors',
                      active ? 'bg-gradient-brand text-white shadow-glow' : 'bg-slate-100 text-slate-600 group-hover:text-slate-900',
                    )}
                  >
                    <tab.icon className="h-4.5 w-4.5" strokeWidth={2.2} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold leading-tight">{tab.label}</span>
                    <span className="block truncate text-[11px] text-slate-400">{tab.hint}</span>
                  </span>
                </motion.button>
              )
            })}
          </motion.div>
        </aside>

        {/* Mobile horizontal chip nav */}
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 no-scrollbar lg:hidden">
          {TABS.map((tab) => {
            const active = tab.id === activeTab
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold ring-focus transition-colors',
                  active ? 'bg-gradient-brand text-white shadow-glow' : 'glass text-slate-600',
                )}
              >
                <tab.icon className="h-4 w-4" strokeWidth={2.2} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        <div className="min-w-0 flex-1">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} variants={tabContent} initial="hidden" animate="show" exit="exit">
              {activeTab === 'profile' && <ProfileSection />}
              {activeTab === 'billing' && <BillingSection />}
              {activeTab === 'storage' && <StorageSection />}
              {activeTab === 'ai' && <AISection />}
              {activeTab === 'appearance' && <AppearanceSection />}
              {activeTab === 'security' && <SecuritySection />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

/* ---------- shared bits ---------- */

function SectionHeading({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-lg font-bold tracking-tight text-slate-900 md:text-xl">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{desc}</p>
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">{children}</label>
}

/* ---------- HỒ SƠ ---------- */

function ProfileSection() {
  const { user } = useAuth()
  const { data: profile } = useAsync(() => api.getProfile(), [])
  const [name, setName] = useState('')
  const [handle, setHandle] = useState('')
  const [email, setEmail] = useState('')
  const [bio, setBio] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const hydrated = useRef(false)

  useEffect(() => {
    if (hydrated.current) return
    const src = profile ?? user
    if (!src) return
    hydrated.current = true
    setName(profile?.name ?? user?.name ?? '')
    setHandle(profile?.handle ?? user?.handle ?? '')
    setEmail(profile?.email ?? user?.email ?? '')
    setBio(profile?.bio ?? '')
  }, [profile, user])

  async function handleSave() {
    setSaving(true)
    try {
      await api.updateProfile({ name, handle, bio })
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2000)
    } catch {
      /* coi như rỗng, không crash */
    } finally {
      setSaving(false)
    }
  }

  return (
    <GlassCard className="p-6 md:p-7">
      <SectionHeading title="Hồ sơ" desc="Đây là cách CloudMind và team của bạn nhìn thấy bạn." />

      <div className="mb-6 flex flex-col items-center gap-4 rounded-2xl bg-slate-50 p-5 sm:flex-row sm:items-center">
        <div className="relative">
          <Avatar initials={user?.initials ?? ''} tone={user?.tone ?? 'indigo'} size="lg" ring />
          <span className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-gradient-brand text-white shadow-glow">
            <Camera className="h-3.5 w-3.5" />
          </span>
        </div>
        <div className="text-center sm:text-left">
          <div className="text-base font-bold text-slate-900">{name}</div>
          <div className="text-sm text-slate-500">{handle}</div>
        </div>
        <div className="sm:ml-auto">
          <Button variant="glass" size="sm">
            <Camera className="h-4 w-4" />
            Đổi ảnh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel>Tên hiển thị</FieldLabel>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên của bạn" />
        </div>
        <div>
          <FieldLabel>Username</FieldLabel>
          <Input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@username" />
        </div>
        <div className="sm:col-span-2">
          <FieldLabel>Email</FieldLabel>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ban@email.vn" />
        </div>
        <div className="sm:col-span-2">
          <FieldLabel>Tiểu sử</FieldLabel>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={160}
            placeholder="Kể vài dòng về bạn..."
            className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 ring-focus transition-colors focus:border-grape-400/50 focus:bg-slate-100"
          />
          <div className="mt-1 text-right text-[11px] text-slate-400">{bio.length}/160</div>
        </div>
      </div>

      <div className="mt-6 flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-end">
        <Button variant="ghost" size="md" className="w-full sm:w-auto">
          Khôi phục
        </Button>
        <Button
          variant="primary"
          size="md"
          className="w-full sm:w-auto"
          disabled={saving}
          onClick={handleSave}
        >
          {saved ? (
            <>
              <Check className="h-4 w-4" />
              Đã lưu!
            </>
          ) : saving ? (
            'Đang lưu...'
          ) : (
            'Lưu thay đổi'
          )}
        </Button>
      </div>
    </GlassCard>
  )
}

/* ---------- GÓI & THANH TOÁN ---------- */

function BillingSection() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: sub, reload: reloadSub } = useAsync(() => api.subscription(), [])
  const { data: invoices } = useAsync(() => api.invoices(), [])

  const handleManage = async () => {
    if (sub && !sub.isFree && sub.status === 'active') {
      if (!window.confirm('Huỷ gia hạn gói hiện tại? Bạn vẫn dùng được tới hết kỳ.')) return
      try { await api.cancelSubscription() } catch { /* ignore */ }
      reloadSub()
    } else {
      navigate('/pricing')
    }
  }

  const planName = sub?.plan?.name ?? user?.plan ?? 'Free'
  const renewAt = sub?.currentPeriodEnd
    ? new Date(sub.currentPeriodEnd).toLocaleDateString('vi-VN')
    : '—'
  const priceMonthly =
    typeof sub?.plan?.priceMonthly === 'number'
      ? `${sub.plan.priceMonthly.toLocaleString('vi-VN')}₫ / tháng`
      : 'Miễn phí'

  return (
    <div className="space-y-5">
      <GlassCard className="overflow-hidden p-0">
        <div className="relative overflow-hidden bg-gradient-brand p-6 md:p-7">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-12 left-1/3 h-36 w-36 rounded-full bg-candy-500/30 blur-3xl" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Crown className="h-5 w-5 text-white" />
                <span className="text-xs font-bold uppercase tracking-widest text-white/80">Gói hiện tại</span>
              </div>
              <div className="text-3xl font-extrabold text-white">CloudMind {planName}</div>
              <p className="mt-1 text-sm text-white/75">
                500 GB lưu trữ · Hỏi đáp AI không giới hạn · Gợi ý thư mục thông minh
              </p>
            </div>
            <div className="shrink-0 rounded-2xl bg-white/15 px-4 py-3 text-white backdrop-blur">
              <div className="text-[11px] uppercase tracking-wide text-white/70">Gia hạn vào</div>
              <div className="text-lg font-bold">{renewAt}</div>
              <div className="text-xs text-white/70">{priceMonthly}</div>
            </div>
          </div>
          <div className="relative mt-5 flex flex-wrap gap-3">
            <Button variant="secondary" size="md" onClick={() => navigate('/pricing')}>
              <ArrowUpRight className="h-4 w-4" />
              Nâng cấp Team
            </Button>
            <Button variant="glass" size="md" className="!bg-white/15 hover:!bg-white/25" onClick={handleManage}>
              {sub && !sub.isFree && sub.status === 'active' ? 'Huỷ gia hạn' : 'Quản lý gói'}
            </Button>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-6 md:p-7">
        <SectionHeading title="Phương thức thanh toán" desc="Thẻ mặc định dùng để gia hạn tự động." />
        <div className="flex flex-col gap-4 rounded-2xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-16 place-items-center rounded-xl bg-ink-600 text-xs font-black tracking-widest text-white">
              VISA
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-800">•••• •••• •••• 4242</div>
              <div className="text-xs text-slate-500">Hết hạn 09/28 · Minh Anh</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone="mint" dot>
              Đang dùng
            </Badge>
            <Button variant="ghost" size="sm">
              Đổi thẻ
            </Button>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-6 md:p-7">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900 md:text-xl">Hoá đơn gần đây</h2>
            <p className="mt-1 text-sm text-slate-500">Tải về để khai báo hoặc lưu trữ.</p>
          </div>
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
            Xem tất cả
          </Button>
        </div>
        <motion.div variants={staggerContainer(0.06)} initial="hidden" animate="show" className="space-y-2">
          {(invoices ?? []).map((inv: any, i: number) => {
            const id = inv?.code ?? inv?.id ?? `INV-${i + 1}`
            const date = inv?.issuedAt
              ? new Date(inv.issuedAt).toLocaleDateString('vi-VN')
              : (inv?.date ?? '—')
            const amount =
              typeof inv?.amount === 'number'
                ? `${inv.amount.toLocaleString('vi-VN')}₫`
                : (inv?.amount ?? '—')
            const status = inv?.status ?? 'Đã thanh toán'
            return (
              <motion.div
                key={id}
                variants={fadeUp}
                className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 transition-colors hover:bg-slate-100"
              >
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-mint-500/15 text-mint-500">
                  <CheckCircle2 className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-slate-800">{id}</div>
                  <div className="text-xs text-slate-500">{date}</div>
                </div>
                <div className="hidden text-sm font-semibold text-slate-800 sm:block">{amount}</div>
                <Badge tone="mint">{status}</Badge>
                <button className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 ring-focus transition-colors hover:bg-slate-100 hover:text-slate-900">
                  <Download className="h-4 w-4" />
                </button>
              </motion.div>
            )
          })}
          {(invoices ?? []).length === 0 && (
            <p className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              Chưa có hoá đơn nào — gói của bạn vẫn đang miễn phí 🎉
            </p>
          )}
        </motion.div>
      </GlassCard>
    </div>
  )
}

/* ---------- LƯU TRỮ ---------- */

function StorageSection() {
  const { user } = useAuth()
  const { data: breakdownRaw } = useAsync(() => api.storageBreakdown(), [])

  const used = user?.storageUsed ?? 0
  const total = user?.storageTotal ?? 1
  const percent = total > 0 ? Math.round((used / total) * 100) : 0

  const storageBreakdown: { name: string; value: number; color: string }[] = (
    (breakdownRaw ?? []) as any[]
  ).map((seg) => ({
    name: STORAGE_LABELS[seg?.type] ?? 'Khác',
    value: Math.round(((seg?.size ?? 0) / 1024 ** 3) * 10) / 10,
    color: STORAGE_COLORS[seg?.type] ?? '#f59e0b',
  }))

  return (
    <div className="space-y-5">
      <GlassCard className="p-6 md:p-7">
        <SectionHeading title="Lưu trữ" desc="Tổng quan dung lượng đang chiếm dụng trên đám mây của bạn." />

        <div className="flex flex-col items-center gap-6 md:flex-row md:items-center md:gap-8">
          <ProgressRing progress={percent} size={150} stroke={12}>
            <div className="text-center">
              <div className="text-3xl font-extrabold text-gradient">{percent}%</div>
              <div className="text-[11px] text-slate-500">đã dùng</div>
            </div>
          </ProgressRing>

          <div className="flex-1">
            <div className="mb-4 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{formatBytes(used)}</span>
              <span className="text-sm text-slate-500">/ {formatBytes(total)}</span>
            </div>
            <motion.div variants={staggerContainer(0.06)} initial="hidden" animate="show" className="space-y-3">
              {storageBreakdown.map((seg) => {
                const segTotalGB = total / 1024 ** 3
                const segPercent = Math.round((seg.value / segTotalGB) * 100)
                return (
                  <motion.div key={seg.name} variants={fadeUp}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 text-slate-600">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: seg.color }} />
                        {seg.name}
                      </span>
                      <span className="font-semibold text-slate-700">{seg.value} GB</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: seg.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${segPercent}%` }}
                        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          </div>
        </div>
      </GlassCard>

      <GlassCard glow className="relative overflow-hidden p-6 md:p-7">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-grape-500/20 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-brand text-white shadow-glow">
              <Wand2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Dọn dẹp gợi ý bởi AI</h3>
                <Badge tone="ai">AI</Badge>
              </div>
              <p className="mt-1 max-w-md text-sm text-slate-600">
                Mình soi ra <span className="font-semibold text-slate-900">14 file trùng lặp</span> và{' '}
                <span className="font-semibold text-slate-900">6 bản nháp cũ</span> — gom lại có thể giải phóng tận{' '}
                <span className="font-semibold text-gradient-mint">4.2 GB</span> 🧹
              </p>
            </div>
          </div>
          <Button variant="primary" size="md" className="shrink-0">
            <Wand2 className="h-4 w-4" />
            Dọn ngay
          </Button>
        </div>
      </GlassCard>
    </div>
  )
}

/* ---------- AI & QUYỀN RIÊNG TƯ ---------- */

interface AIRow {
  icon: LucideIcon
  title: string
  desc: string
}

function AISection() {
  const { data: settings } = useAsync(() => api.getSettings(), [])
  const [autoSummary, setAutoSummary] = useState(true)
  const [smartFolders, setSmartFolders] = useState(true)
  const [allowIndex, setAllowIndex] = useState(true)
  const [improveData, setImproveData] = useState(false)
  const hydrated = useRef(false)

  useEffect(() => {
    if (hydrated.current || !settings?.ai) return
    hydrated.current = true
    setAutoSummary(settings.ai.autoSummarize ?? true)
    setSmartFolders(settings.ai.folderSuggestions ?? true)
    setAllowIndex(settings.ai.allowIndexing ?? true)
    setImproveData(settings.ai.improveModel ?? false)
  }, [settings])

  function persist(patch: Record<string, boolean>) {
    api.updateAiSettings(patch).catch(() => {
      /* coi như rỗng, không crash */
    })
  }

  const rows: { def: AIRow; value: boolean; set: (v: boolean) => void }[] = [
    {
      def: {
        icon: Wand2,
        title: 'Tự động tóm tắt khi tải lên',
        desc: 'Mỗi file mới sẽ được AI đọc và tạo tóm tắt ngắn gọn ngay lập tức.',
      },
      value: autoSummary,
      set: (v) => {
        setAutoSummary(v)
        persist({ autoSummarize: v })
      },
    },
    {
      def: {
        icon: FolderTree,
        title: 'Gợi ý thư mục thông minh',
        desc: 'AI đoán file nên nằm ở đâu dựa trên nội dung, đỡ phải kéo thả thủ công.',
      },
      value: smartFolders,
      set: (v) => {
        setSmartFolders(v)
        persist({ folderSuggestions: v })
      },
    },
    {
      def: {
        icon: ScanSearch,
        title: 'Cho phép AI lập chỉ mục',
        desc: 'Bật để tìm kiếm ngữ nghĩa và hỏi đáp tài liệu hoạt động chuẩn nhất.',
      },
      value: allowIndex,
      set: (v) => {
        setAllowIndex(v)
        persist({ allowIndexing: v })
      },
    },
    {
      def: {
        icon: FlaskConical,
        title: 'Dùng dữ liệu để cải thiện',
        desc: 'Chia sẻ dữ liệu ẩn danh để giúp mô hình thông minh hơn. Bạn toàn quyền tắt.',
      },
      value: improveData,
      set: (v) => {
        setImproveData(v)
        persist({ improveModel: v })
      },
    },
  ]

  return (
    <div className="space-y-5">
      <GlassCard className="p-6 md:p-7">
        <SectionHeading
          title="AI & Quyền riêng tư"
          desc="Bạn là sếp. Quyết định AI được làm gì với dữ liệu của mình."
        />
        <motion.div variants={staggerContainer(0.06)} initial="hidden" animate="show" className="space-y-3">
          {rows.map((row) => (
            <motion.div
              key={row.def.title}
              variants={fadeUp}
              className={cn(
                'flex items-start gap-4 rounded-2xl border p-4 transition-colors',
                row.value ? 'border-grape-400/25 bg-slate-50' : 'border-slate-200 bg-slate-50',
              )}
            >
              <div
                className={cn(
                  'grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-colors',
                  row.value ? 'bg-gradient-brand text-white' : 'bg-slate-100 text-slate-500',
                )}
              >
                <row.def.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-slate-800">{row.def.title}</div>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{row.def.desc}</p>
              </div>
              <Toggle checked={row.value} onChange={row.set} className="mt-0.5" />
            </motion.div>
          ))}
        </motion.div>
      </GlassCard>

      <GlassCard className="flex items-center gap-3 p-5">
        <ShieldCheck className="h-5 w-5 shrink-0 text-mint-500" />
        <p className="text-sm text-slate-600">
          Dữ liệu của bạn được mã hoá end-to-end. AI chỉ chạm vào file khi bạn cho phép, không bao giờ rò rỉ ra ngoài 🔐
        </p>
      </GlassCard>
    </div>
  )
}

/* ---------- GIAO DIỆN ---------- */

interface ThemeOption {
  id: string
  label: string
  desc: string
  icon: LucideIcon
}

const themeOptions: ThemeOption[] = [
  { id: 'dark', label: 'Tối', desc: 'Mặc định, dịu mắt', icon: Moon },
  { id: 'light', label: 'Sáng', desc: 'Tươi sáng ban ngày', icon: Sun },
  { id: 'auto', label: 'Tự động', desc: 'Theo hệ thống', icon: Monitor },
]

const accentSwatches: { id: string; label: string; className: string }[] = [
  { id: 'ink', label: 'Ink', className: 'bg-ink-500' },
  { id: 'grape', label: 'Grape', className: 'bg-grape-500' },
  { id: 'candy', label: 'Candy', className: 'bg-candy-500' },
  { id: 'mint', label: 'Mint', className: 'bg-mint-500' },
  { id: 'sky2', label: 'Sky', className: 'bg-sky2-500' },
  { id: 'sun', label: 'Sun', className: 'bg-sun-500' },
]

function AppearanceSection() {
  const { data: settings } = useAsync(() => api.getSettings(), [])
  const [theme, setTheme] = useState('dark')
  const [accent, setAccent] = useState('grape')
  const [reduceMotion, setReduceMotion] = useState(false)
  const hydrated = useRef(false)

  useEffect(() => {
    if (hydrated.current || !settings?.appearance) return
    hydrated.current = true
    setTheme(settings.appearance.theme ?? 'dark')
    setAccent(settings.appearance.accent ?? 'grape')
    setReduceMotion(settings.appearance.reduceMotion ?? false)
  }, [settings])

  function persist(patch: Record<string, unknown>) {
    api.updateAppearance(patch).catch(() => {
      /* coi như rỗng, không crash */
    })
  }

  function changeTheme(v: string) {
    setTheme(v)
    persist({ theme: v })
  }
  function changeAccent(v: string) {
    setAccent(v)
    persist({ accent: v })
  }
  function changeReduceMotion(v: boolean) {
    setReduceMotion(v)
    persist({ reduceMotion: v })
  }

  return (
    <div className="space-y-5">
      <GlassCard className="p-6 md:p-7">
        <SectionHeading title="Chủ đề" desc="Chọn vibe sáng hay tối cho không gian của bạn." />
        <motion.div
          variants={staggerContainer(0.06)}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-3 sm:grid-cols-3"
        >
          {themeOptions.map((opt) => {
            const active = opt.id === theme
            return (
              <motion.button
                key={opt.id}
                variants={fadeUp}
                onClick={() => changeTheme(opt.id)}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  'relative overflow-hidden rounded-2xl border p-4 text-left ring-focus transition-colors',
                  active ? 'border-grape-400/50 bg-slate-50 shadow-glow' : 'border-slate-200 bg-slate-50 hover:border-slate-300',
                )}
              >
                {active && (
                  <span className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full bg-gradient-brand text-white">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                )}
                <div
                  className={cn(
                    'grid h-10 w-10 place-items-center rounded-xl transition-colors',
                    active ? 'bg-gradient-brand text-white' : 'bg-slate-100 text-slate-500',
                  )}
                >
                  <opt.icon className="h-5 w-5" />
                </div>
                <div className="mt-3 text-sm font-bold text-slate-900">{opt.label}</div>
                <div className="text-xs text-slate-400">{opt.desc}</div>
              </motion.button>
            )
          })}
        </motion.div>
      </GlassCard>

      <GlassCard className="p-6 md:p-7">
        <SectionHeading title="Màu nhấn" desc="Màu chủ đạo cho nút, badge và điểm nhấn khắp app." />
        <div className="flex flex-wrap gap-3">
          {accentSwatches.map((sw) => {
            const active = sw.id === accent
            return (
              <button
                key={sw.id}
                onClick={() => changeAccent(sw.id)}
                className="group flex flex-col items-center gap-1.5 ring-focus"
                aria-label={sw.label}
              >
                <motion.span
                  whileHover={{ scale: 1.12 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    'grid h-11 w-11 place-items-center rounded-2xl shadow-card transition-all',
                    sw.className,
                    active ? 'ring-2 ring-white ring-offset-2 ring-offset-surface-0' : 'ring-1 ring-slate-200',
                  )}
                >
                  {active && <Check className="h-5 w-5 text-white drop-shadow" />}
                </motion.span>
                <span className={cn('text-[11px]', active ? 'font-semibold text-slate-900' : 'text-slate-400')}>{sw.label}</span>
              </button>
            )
          })}
        </div>
      </GlassCard>

      <GlassCard className="flex items-center justify-between gap-4 p-5 md:p-6">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-800">Giảm chuyển động</div>
            <p className="mt-0.5 text-xs text-slate-500">Tắt bớt hiệu ứng động cho trải nghiệm nhẹ nhàng, ổn định hơn.</p>
          </div>
        </div>
        <Toggle checked={reduceMotion} onChange={changeReduceMotion} />
      </GlassCard>
    </div>
  )
}

/* ---------- BẢO MẬT ---------- */

interface SessionDef {
  icon: ComponentType<{ className?: string }>
  device: string
  meta: string
  current: boolean
}

const sessions: SessionDef[] = [
  { icon: Laptop, device: 'MacBook Pro · Chrome', meta: 'Hà Nội, VN · Đang hoạt động', current: true },
  { icon: Smartphone, device: 'iPhone 16 · CloudMind App', meta: 'Hà Nội, VN · 2 giờ trước', current: false },
  { icon: Tablet, device: 'iPad Air · Safari', meta: 'TP.HCM, VN · Hôm qua', current: false },
]

function SecuritySection() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [twoFA, setTwoFA] = useState(true)
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwSaved, setPwSaved] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  function toggle2fa(v: boolean) {
    setTwoFA(v)
    api.toggle2fa(v).catch(() => {
      /* coi như rỗng, không crash */
    })
  }

  async function handleChangePassword() {
    if (!current || !next || next !== confirm) return
    setPwSaving(true)
    try {
      await api.changePassword({ oldPassword: current, newPassword: next })
      setPwSaved(true)
      setCurrent('')
      setNext('')
      setConfirm('')
      window.setTimeout(() => setPwSaved(false), 2000)
    } catch {
      /* coi như rỗng, không crash */
    } finally {
      setPwSaving(false)
    }
  }

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await logout()
    } finally {
      navigate('/login')
    }
  }

  return (
    <div className="space-y-5">
      <GlassCard className="p-6 md:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'grid h-11 w-11 shrink-0 place-items-center rounded-2xl transition-colors',
                twoFA ? 'bg-mint-500 text-white' : 'bg-slate-100 text-slate-500',
              )}
            >
              <ShieldCheck className="h-5.5 w-5.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Xác thực 2 lớp (2FA)</h3>
                {twoFA ? (
                  <Badge tone="mint" dot>
                    Đang bật
                  </Badge>
                ) : (
                  <Badge tone="neutral">Đang tắt</Badge>
                )}
              </div>
              <p className="mt-1 max-w-md text-sm text-slate-600">
                Thêm một lớp bảo vệ — cần mã từ app authenticator mỗi khi đăng nhập thiết bị lạ.
              </p>
            </div>
          </div>
          <Toggle checked={twoFA} onChange={toggle2fa} className="mt-1" />
        </div>
      </GlassCard>

      <GlassCard className="p-6 md:p-7">
        <SectionHeading title="Đổi mật khẩu" desc="Nên đổi định kỳ và đừng dùng lại mật khẩu cũ nha." />
        <div className="grid gap-4">
          <div>
            <FieldLabel>Mật khẩu hiện tại</FieldLabel>
            <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="••••••••" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>Mật khẩu mới</FieldLabel>
              <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} placeholder="Ít nhất 8 ký tự" />
            </div>
            <div>
              <FieldLabel>Xác nhận mật khẩu</FieldLabel>
              <Input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Nhập lại lần nữa"
              />
            </div>
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <Button variant="primary" size="md" disabled={pwSaving} onClick={handleChangePassword}>
            {pwSaved ? (
              <>
                <Check className="h-4 w-4" />
                Đã cập nhật!
              </>
            ) : (
              <>
                <KeyRound className="h-4 w-4" />
                {pwSaving ? 'Đang lưu...' : 'Cập nhật mật khẩu'}
              </>
            )}
          </Button>
        </div>
      </GlassCard>

      <GlassCard className="p-6 md:p-7">
        <SectionHeading title="Phiên đăng nhập" desc="Những thiết bị đang truy cập tài khoản của bạn." />
        <motion.div variants={staggerContainer(0.06)} initial="hidden" animate="show" className="space-y-2">
          {sessions.map((s) => (
            <motion.div
              key={s.device}
              variants={fadeUp}
              className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3"
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
                <s.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-slate-800">{s.device}</div>
                <div className="text-xs text-slate-500">{s.meta}</div>
              </div>
              {s.current ? (
                <Badge tone="mint" dot>
                  Thiết bị này
                </Badge>
              ) : (
                <Button variant="ghost" size="sm" className="text-candy-500 hover:text-candy-600">
                  Thu hồi
                </Button>
              )}
            </motion.div>
          ))}
        </motion.div>
      </GlassCard>

      <GlassCard className="flex flex-col gap-4 border border-candy-500/20 p-6 sm:flex-row sm:items-center sm:justify-between md:p-7">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-candy-500/15 text-candy-500">
            <LogOut className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Đăng xuất tất cả thiết bị</h3>
            <p className="mt-1 max-w-md text-sm text-slate-600">
              Kết thúc mọi phiên ở mọi nơi. Bạn sẽ cần đăng nhập lại trên thiết bị này.
            </p>
          </div>
        </div>
        <Button variant="danger" size="md" className="shrink-0" disabled={loggingOut} onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          {loggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
        </Button>
      </GlassCard>
    </div>
  )
}