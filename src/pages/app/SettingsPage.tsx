import { useEffect, useMemo, useRef, useState } from 'react'
import type { ComponentType, ChangeEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  User,
  CreditCard,
  HardDrive,
  Sparkles,
  Palette,
  Languages,
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
  Loader2,
  Trash2,
  AlertTriangle,
  type LucideIcon,
} from 'lucide-react'
import { Button, Badge, GlassCard, Avatar, Input, Toggle, ProgressRing, useFileTypeLabel } from '@/components/ui'
import { PageHeader } from '@/components/shared/PageHeader'
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { useT, type TranslationKey, type TFunc } from '@/lib/i18n'
import { useAsync } from '@/lib/useApi'
import { cn, formatBytes, timeAgo } from '@/lib/utils'
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

// `id` giữ nguyên làm ID logic ổn định (khớp state activeTab & so sánh nơi khác);
// chỉ nhãn & gợi ý hiển thị được dịch qua labelKey/hintKey.
type TabId = 'profile' | 'billing' | 'storage' | 'ai' | 'appearance' | 'security'

interface TabDef {
  id: TabId
  labelKey: TranslationKey
  hintKey: TranslationKey
  icon: LucideIcon
}

const TABS: TabDef[] = [
  { id: 'profile', labelKey: 'settings.tabProfile', hintKey: 'settings.tabProfileHint', icon: User },
  { id: 'billing', labelKey: 'settings.tabBilling', hintKey: 'settings.tabBillingHint', icon: CreditCard },
  { id: 'storage', labelKey: 'settings.tabStorage', hintKey: 'settings.tabStorageHint', icon: HardDrive },
  { id: 'ai', labelKey: 'settings.tabAi', hintKey: 'settings.tabAiHint', icon: Sparkles },
  { id: 'appearance', labelKey: 'settings.tabAppearance', hintKey: 'settings.tabAppearanceHint', icon: Palette },
  { id: 'security', labelKey: 'settings.tabSecurity', hintKey: 'settings.tabSecurityHint', icon: ShieldCheck },
]

const tabContent = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.2 } },
}

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('profile')
  const t = useT()

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        eyebrow={<Badge tone="brand" dot>{t('settings.eyebrow')}</Badge>}
        title={t('settings.title')}
        subtitle={t('settings.subtitle')}
      />

      <GlassCard className="mb-6 flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-ink-50 text-ink-600">
            <Languages className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">{t('lang.label')}</h3>
            <p className="text-xs text-slate-500">{t('lang.desc')}</p>
          </div>
        </div>
        <LanguageSwitcher />
      </GlassCard>

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
                    <span className="block text-sm font-semibold leading-tight">{t(tab.labelKey)}</span>
                    <span className="block truncate text-[11px] text-slate-400">{t(tab.hintKey)}</span>
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
                {t(tab.labelKey)}
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
  const t = useT()
  const { user, refreshUser } = useAuth()
  const { data: profile } = useAsync(() => api.getProfile(), [])
  const [name, setName] = useState('')
  const [handle, setHandle] = useState('')
  const [email, setEmail] = useState('')
  const [bio, setBio] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const hydrated = useRef(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  async function handleAvatarPick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    try {
      await api.uploadAvatar(file)
      await refreshUser()
    } catch {
      /* bỏ qua lỗi — không crash */
    } finally {
      setUploadingAvatar(false)
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    }
  }

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

  function handleReset() {
    setName(profile?.name ?? user?.name ?? '')
    setHandle(profile?.handle ?? user?.handle ?? '')
    setEmail(profile?.email ?? user?.email ?? '')
    setBio(profile?.bio ?? '')
  }

  return (
    <GlassCard className="p-6 md:p-7">
      <SectionHeading title={t('settings.profileTitle')} desc={t('settings.profileDesc')} />

      <div className="mb-6 flex flex-col items-center gap-4 rounded-2xl bg-slate-50 p-5 sm:flex-row sm:items-center">
        <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarPick} />
        <button type="button" onClick={() => avatarInputRef.current?.click()} className="relative ring-focus rounded-full" aria-label={t('settings.changeAvatarAria')}>
          <Avatar initials={user?.initials ?? ''} tone={user?.tone ?? 'indigo'} size="lg" ring />
          <span className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-gradient-brand text-white shadow-glow">
            {uploadingAvatar ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
          </span>
        </button>
        <div className="text-center sm:text-left">
          <div className="text-base font-bold text-slate-900">{name}</div>
          <div className="text-sm text-slate-500">{handle}</div>
        </div>
        <div className="sm:ml-auto">
          <Button variant="glass" size="sm" disabled={uploadingAvatar} onClick={() => avatarInputRef.current?.click()}>
            <Camera className="h-4 w-4" />
            {uploadingAvatar ? t('common.loading') : t('settings.changePhoto')}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel>{t('settings.displayName')}</FieldLabel>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('auth.name')} />
        </div>
        <div>
          <FieldLabel>{t('settings.username')}</FieldLabel>
          <Input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@username" />
        </div>
        <div className="sm:col-span-2">
          <FieldLabel>{t('auth.email')}</FieldLabel>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('settings.emailPlaceholder')} />
        </div>
        <div className="sm:col-span-2">
          <FieldLabel>{t('settings.bio')}</FieldLabel>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={160}
            placeholder={t('settings.bioPlaceholder')}
            className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 ring-focus transition-colors focus:border-grape-400/50 focus:bg-slate-100"
          />
          <div className="mt-1 text-right text-[11px] text-slate-400">{bio.length}/160</div>
        </div>
      </div>

      <div className="mt-6 flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-end">
        <Button variant="ghost" size="md" className="w-full sm:w-auto" onClick={handleReset}>
          {t('settings.reset')}
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
              {t('settings.saved')}
            </>
          ) : saving ? (
            t('settings.saving')
          ) : (
            t('common.save')
          )}
        </Button>
      </div>
    </GlassCard>
  )
}

/* ---------- GÓI & THANH TOÁN ---------- */

function BillingSection() {
  const t = useT()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: sub, reload: reloadSub } = useAsync(() => api.subscription(), [])
  const { data: invoices } = useAsync(() => api.invoices(), [])

  const handleManage = async () => {
    if (sub && !sub.isFree && sub.status === 'active') {
      if (!window.confirm(t('settings.cancelRenewConfirm'))) return
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
      ? t('settings.pricePerMonth', { price: sub.plan.priceMonthly.toLocaleString('vi-VN') })
      : t('settings.free')

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
                <span className="text-xs font-bold uppercase tracking-widest text-white/80">{t('settings.currentPlan')}</span>
              </div>
              <div className="text-3xl font-extrabold text-white">CloudMind {planName}</div>
              <p className="mt-1 text-sm text-white/75">
                {t('settings.planFeatures')}
              </p>
            </div>
            <div className="shrink-0 rounded-2xl bg-white/15 px-4 py-3 text-white backdrop-blur">
              <div className="text-[11px] uppercase tracking-wide text-white/70">{t('settings.renewsOn')}</div>
              <div className="text-lg font-bold">{renewAt}</div>
              <div className="text-xs text-white/70">{priceMonthly}</div>
            </div>
          </div>
          <div className="relative mt-5 flex flex-wrap gap-3">
            <Button variant="secondary" size="md" onClick={() => navigate('/pricing')}>
              <ArrowUpRight className="h-4 w-4" />
              {t('sidebar.upgradeTitle')}
            </Button>
            <Button variant="glass" size="md" className="!bg-white/15 hover:!bg-white/25" onClick={handleManage}>
              {sub && !sub.isFree && sub.status === 'active' ? t('settings.cancelRenew') : t('settings.managePlan')}
            </Button>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-6 md:p-7">
        <SectionHeading title={t('settings.paymentMethodTitle')} desc={t('settings.paymentMethodDesc')} />
        <div className="flex flex-col gap-4 rounded-2xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-16 place-items-center rounded-xl bg-ink-600 text-xs font-black tracking-widest text-white">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-800">{t('settings.payosSecure')}</div>
              <div className="text-xs text-slate-500">{t('settings.payosDesc')}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone="mint" dot>
              {t('settings.inUse')}
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => navigate('/pricing')}>
              {t('settings.changeCard')}
            </Button>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-6 md:p-7">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900 md:text-xl">{t('settings.invoicesTitle')}</h2>
            <p className="mt-1 text-sm text-slate-500">{t('settings.invoicesDesc')}</p>
          </div>
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
            const status = inv?.status ?? t('settings.paid')
            const downloadUrl: string | undefined =
              inv?.url ?? inv?.link ?? inv?.downloadUrl ?? inv?.invoiceUrl
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
                {downloadUrl && (
                  <button
                    onClick={() => window.open(downloadUrl, '_blank', 'noopener,noreferrer')}
                    aria-label={t('settings.downloadInvoiceAria')}
                    className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 ring-focus transition-colors hover:bg-slate-100 hover:text-slate-900"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                )}
              </motion.div>
            )
          })}
          {(invoices ?? []).length === 0 && (
            <p className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              {t('settings.noInvoices')}
            </p>
          )}
        </motion.div>
      </GlassCard>
    </div>
  )
}

/* ---------- LƯU TRỮ ---------- */

function StorageSection() {
  const t = useT()
  const fileTypeLabel = useFileTypeLabel()
  const { user } = useAuth()
  const { data: breakdownRaw } = useAsync(() => api.storageBreakdown(), [])

  const used = user?.storageUsed ?? 0
  const total = user?.storageTotal ?? 1
  const percent = total > 0 ? Math.round((used / total) * 100) : 0

  const storageBreakdown: { name: string; value: number; color: string }[] = (
    (breakdownRaw ?? []) as any[]
  ).map((seg) => ({
    // seg?.type là mã loại tệp (logic từ backend); nhãn hiển thị dịch qua useFileTypeLabel.
    name: seg?.type in STORAGE_COLORS ? fileTypeLabel(seg.type) : t('settings.storageOther'),
    value: Math.round(((seg?.size ?? 0) / 1024 ** 3) * 10) / 10,
    color: STORAGE_COLORS[seg?.type] ?? '#f59e0b',
  }))

  return (
    <div className="space-y-5">
      <GlassCard className="p-6 md:p-7">
        <SectionHeading title={t('settings.storageTitle')} desc={t('settings.storageDesc')} />

        <div className="flex flex-col items-center gap-6 md:flex-row md:items-center md:gap-8">
          <ProgressRing progress={percent} size={150} stroke={12}>
            <div className="text-center">
              <div className="text-3xl font-extrabold text-gradient">{percent}%</div>
              <div className="text-[11px] text-slate-500">{t('dashboard.used')}</div>
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
                <h3 className="text-base font-bold text-slate-900">{t('settings.cleanupTitle')}</h3>
                <Badge tone="ai">AI</Badge>
              </div>
              <p className="mt-1 max-w-md text-sm text-slate-600">
                {t('settings.cleanupDesc')}
              </p>
            </div>
          </div>
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
  const t = useT()
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

  const rows: { id: string; def: AIRow; value: boolean; set: (v: boolean) => void }[] = [
    {
      id: 'autoSummary',
      def: {
        icon: Wand2,
        title: t('settings.aiAutoSummaryTitle'),
        desc: t('settings.aiAutoSummaryDesc'),
      },
      value: autoSummary,
      set: (v) => {
        setAutoSummary(v)
        persist({ autoSummarize: v })
      },
    },
    {
      id: 'smartFolders',
      def: {
        icon: FolderTree,
        title: t('settings.aiSmartFoldersTitle'),
        desc: t('settings.aiSmartFoldersDesc'),
      },
      value: smartFolders,
      set: (v) => {
        setSmartFolders(v)
        persist({ folderSuggestions: v })
      },
    },
    {
      id: 'allowIndex',
      def: {
        icon: ScanSearch,
        title: t('settings.aiIndexTitle'),
        desc: t('settings.aiIndexDesc'),
      },
      value: allowIndex,
      set: (v) => {
        setAllowIndex(v)
        persist({ allowIndexing: v })
      },
    },
    {
      id: 'improveData',
      def: {
        icon: FlaskConical,
        title: t('settings.aiImproveTitle'),
        desc: t('settings.aiImproveDesc'),
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
          title={t('settings.aiTitle')}
          desc={t('settings.aiDesc')}
        />
        <motion.div variants={staggerContainer(0.06)} initial="hidden" animate="show" className="space-y-3">
          {rows.map((row) => (
            <motion.div
              key={row.id}
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
          {t('settings.aiPrivacyNote')}
        </p>
      </GlassCard>
    </div>
  )
}

/* ---------- GIAO DIỆN ---------- */

interface ThemeOption {
  id: string
  labelKey: TranslationKey
  descKey: TranslationKey
  icon: LucideIcon
}

// `id` là giá trị logic (khớp state theme & gửi lên API); nhãn/mô tả dịch qua labelKey/descKey.
const themeOptions: ThemeOption[] = [
  { id: 'dark', labelKey: 'settings.themeDark', descKey: 'settings.themeDarkDesc', icon: Moon },
  { id: 'light', labelKey: 'settings.themeLight', descKey: 'settings.themeLightDesc', icon: Sun },
  { id: 'auto', labelKey: 'settings.themeAuto', descKey: 'settings.themeAutoDesc', icon: Monitor },
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
  const t = useT()
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
        <SectionHeading title={t('settings.themeTitle')} desc={t('settings.themeDesc')} />
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
                <div className="mt-3 text-sm font-bold text-slate-900">{t(opt.labelKey)}</div>
                <div className="text-xs text-slate-400">{t(opt.descKey)}</div>
              </motion.button>
            )
          })}
        </motion.div>
      </GlassCard>

      <GlassCard className="p-6 md:p-7">
        <SectionHeading title={t('settings.accentTitle')} desc={t('settings.accentDesc')} />
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
            <div className="text-sm font-semibold text-slate-800">{t('settings.reduceMotion')}</div>
            <p className="mt-0.5 text-xs text-slate-500">{t('settings.reduceMotionDesc')}</p>
          </div>
        </div>
        <Toggle checked={reduceMotion} onChange={changeReduceMotion} />
      </GlassCard>
    </div>
  )
}

/* ---------- BẢO MẬT ---------- */

interface ApiSession {
  id: string
  userAgent?: string
  ip?: string
  createdAt: string
  expiresAt?: string
}

/** Suy ra nhãn thiết bị + icon từ user-agent. Nhãn hãng/OS/trình duyệt là tên riêng, giữ nguyên. */
function deviceFromUA(ua: string | undefined, t: TFunc): { label: string; icon: ComponentType<{ className?: string }> } {
  const s = (ua ?? '').toLowerCase()
  if (s.includes('iphone')) return { label: 'iPhone', icon: Smartphone }
  if (s.includes('ipad')) return { label: 'iPad', icon: Tablet }
  if (s.includes('android')) return { label: 'Android', icon: Smartphone }
  let os = t('settings.deviceGeneric')
  if (s.includes('mac')) os = 'macOS'
  else if (s.includes('windows')) os = 'Windows'
  else if (s.includes('linux')) os = 'Linux'
  let browser = ''
  if (s.includes('edg')) browser = 'Edge'
  else if (s.includes('chrome')) browser = 'Chrome'
  else if (s.includes('firefox')) browser = 'Firefox'
  else if (s.includes('safari')) browser = 'Safari'
  return { label: [os, browser].filter(Boolean).join(' · '), icon: Laptop }
}

function SecuritySection() {
  const t = useT()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { data: profile } = useAsync(() => api.getProfile(), [])
  const { data: sessionsData, reload: reloadSessions } = useAsync(
    () => api.listSessions() as Promise<ApiSession[]>,
    [],
  )
  const sessions = useMemo(() => {
    const list = (sessionsData ?? []) as ApiSession[]
    return list.map((s, i) => {
      const d = deviceFromUA(s.userAgent, t)
      return {
        id: s.id,
        icon: d.icon,
        device: d.label,
        meta: [s.ip, timeAgo(s.createdAt)].filter(Boolean).join(' · '),
        current: i === 0, // suy đoán: phiên mới nhất là thiết bị hiện tại
      }
    })
  }, [sessionsData, t])
  const [twoFA, setTwoFA] = useState(false)
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwSaved, setPwSaved] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [revoking, setRevoking] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const twoFaHydrated = useRef(false)

  useEffect(() => {
    if (twoFaHydrated.current || !profile) return
    twoFaHydrated.current = true
    setTwoFA(Boolean((profile as { twoFactorEnabled?: boolean }).twoFactorEnabled))
  }, [profile])

  function toggle2fa(v: boolean) {
    setTwoFA(v)
    api.toggle2fa(v).catch(() => {
      /* coi như rỗng, không crash */
    })
  }

  async function handleRevoke(id: string) {
    setRevoking(id)
    try {
      await api.revokeSession(id)
      reloadSessions()
    } catch {
      /* coi như rỗng */
    } finally {
      setRevoking(null)
    }
  }

  async function handleDeleteAccount() {
    if (!window.confirm(t('settings.deleteAccountConfirm'))) return
    setDeleting(true)
    try {
      await api.deleteAccount()
      await logout()
    } finally {
      navigate('/')
    }
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
                <h3 className="text-base font-bold text-slate-900">{t('settings.twoFaTitle')}</h3>
                {twoFA ? (
                  <Badge tone="mint" dot>
                    {t('settings.on')}
                  </Badge>
                ) : (
                  <Badge tone="neutral">{t('settings.off')}</Badge>
                )}
              </div>
              <p className="mt-1 max-w-md text-sm text-slate-600">
                {t('settings.twoFaDesc')}
              </p>
            </div>
          </div>
          <Toggle checked={twoFA} onChange={toggle2fa} className="mt-1" />
        </div>
      </GlassCard>

      <GlassCard className="p-6 md:p-7">
        <SectionHeading title={t('settings.changePwTitle')} desc={t('settings.changePwDesc')} />
        <div className="grid gap-4">
          <div>
            <FieldLabel>{t('settings.currentPw')}</FieldLabel>
            <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="••••••••" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>{t('auth.newPassword')}</FieldLabel>
              <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} placeholder={t('settings.pwMinHint')} />
            </div>
            <div>
              <FieldLabel>{t('settings.confirmPw')}</FieldLabel>
              <Input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder={t('settings.confirmPwPlaceholder')}
              />
            </div>
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <Button variant="primary" size="md" disabled={pwSaving} onClick={handleChangePassword}>
            {pwSaved ? (
              <>
                <Check className="h-4 w-4" />
                {t('settings.updated')}
              </>
            ) : (
              <>
                <KeyRound className="h-4 w-4" />
                {pwSaving ? t('settings.saving') : t('settings.updatePw')}
              </>
            )}
          </Button>
        </div>
      </GlassCard>

      <GlassCard className="p-6 md:p-7">
        <SectionHeading title={t('settings.sessionsTitle')} desc={t('settings.sessionsDesc')} />
        <motion.div variants={staggerContainer(0.06)} initial="hidden" animate="show" className="space-y-2">
          {sessions.map((s) => (
            <motion.div
              key={s.id}
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
                  {t('settings.thisDevice')}
                </Badge>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-candy-500 hover:text-candy-600"
                  disabled={revoking === s.id}
                  onClick={() => handleRevoke(s.id)}
                >
                  {revoking === s.id ? t('settings.revoking') : t('settings.revoke')}
                </Button>
              )}
            </motion.div>
          ))}
          {sessions.length === 0 && (
            <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-400">{t('settings.noOtherSessions')}</p>
          )}
        </motion.div>
      </GlassCard>

      <GlassCard className="flex flex-col gap-4 border border-candy-500/20 p-6 sm:flex-row sm:items-center sm:justify-between md:p-7">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-candy-500/15 text-candy-500">
            <LogOut className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">{t('settings.logoutAllTitle')}</h3>
            <p className="mt-1 max-w-md text-sm text-slate-600">
              {t('settings.logoutAllDesc')}
            </p>
          </div>
        </div>
        <Button variant="danger" size="md" className="shrink-0" disabled={loggingOut} onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          {loggingOut ? t('settings.loggingOut') : t('settings.logout')}
        </Button>
      </GlassCard>

      <GlassCard className="flex flex-col gap-4 border border-rose-500/25 bg-rose-50/30 p-6 sm:flex-row sm:items-center sm:justify-between md:p-7">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-rose-500/15 text-rose-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">{t('settings.deleteAccount')}</h3>
            <p className="mt-1 max-w-md text-sm text-slate-600">
              {t('settings.deleteAccountDesc')}
            </p>
          </div>
        </div>
        <Button variant="danger" size="md" className="shrink-0" disabled={deleting} onClick={handleDeleteAccount}>
          <Trash2 className="h-4 w-4" />
          {deleting ? t('settings.deleting') : t('settings.deleteAccount')}
        </Button>
      </GlassCard>
    </div>
  )
}