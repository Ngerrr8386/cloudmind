import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  MessageSquareText,
  FileText,
  Network,
  FolderTree,
  ShieldCheck,
  UploadCloud,
  Sparkles,
  Compass,
  ArrowRight,
  PlayCircle,
  Star,
  Check,
  Plus,
  Minus,
  Quote,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import {
  Button,
  Badge,
  GlassCard,
  Avatar,
  AIChip,
  ConfidenceMeter,
  ProgressBar,
  FileTypeIcon,
  AnimatedBackground,
} from '@/components/ui'
import { MarketingNav } from '@/components/layout/MarketingNav'
import { Footer, MarketingLayout } from '@/components/layout/Footer'
import {
  heroStats,
  testimonials,
  faqs,
  pricingPlans,
  searchResults,
} from '@/lib/mockData'
import type { SearchResult } from '@/lib/types'
import { cn, formatNumber } from '@/lib/utils'
import { tone, type Tone } from '@/lib/theme'
import {
  staggerContainer,
  fadeUp,
  fadeUpLg,
  scaleIn,
  popIn,
  spring,
  softSpring,
} from '@/lib/motion'
import { useT, type TranslationKey } from '@/lib/i18n'

/* ============================ HERO ============================ */

const floatingChips = [
  { labelKey: 'landing.chipProject' as TranslationKey, type: 'pdf' as const, className: 'left-[-6%] top-[14%]', delay: 0 },
  { labelKey: 'landing.chipRevenue' as TranslationKey, type: 'sheet' as const, className: 'right-[-8%] top-[8%]', delay: 0.6 },
  { labelKey: 'landing.chipDemo' as TranslationKey, type: 'video' as const, className: 'left-[-4%] bottom-[18%]', delay: 1.1 },
  { labelKey: 'landing.chipMoodboard' as TranslationKey, type: 'image' as const, className: 'right-[-5%] bottom-[10%]', delay: 1.6 },
]

/** heroStats comes from mockData (landing-only); translate its labels by mapping the VN label → key. */
const heroStatLabelKeys: Record<string, TranslationKey> = {
  'Tài liệu được xử lý': 'landing.stat.docsProcessed',
  'Người dùng tin tưởng': 'landing.stat.trustedUsers',
  'Độ chính xác tìm kiếm': 'landing.stat.searchAccuracy',
  'Thời gian tiết kiệm': 'landing.stat.timeSaved',
}

/** heroStats values are locale-neutral (numbers/%) except the VN time value. */
const heroStatValueKeys: Record<string, TranslationKey> = {
  '6h/tuần': 'landing.stat.timeSavedValue',
}

/** Testimonials come from shared mockData; resolve role + quote per id (name kept as data). */
const TESTI_KEYS: Record<string, { role: TranslationKey; quote: TranslationKey }> = {
  t1: { role: 'testi.t1.role', quote: 'testi.t1.quote' },
  t2: { role: 'testi.t2.role', quote: 'testi.t2.quote' },
  t3: { role: 'testi.t3.role', quote: 'testi.t3.quote' },
  t4: { role: 'testi.t4.role', quote: 'testi.t4.quote' },
}

/** Pro-plan feature bullets (shared mockData order) → reuse the pricing.* keys. */
const PRO_FEATURE_KEYS: TranslationKey[] = [
  'pricing.featStorage500',
  'pricing.featSearchAdvanced',
  'pricing.featAiUnlimited',
  'pricing.featAutoSummary',
  'pricing.featSmartFolders',
  'pricing.featKnowledgeMining',
]

/** FAQ list (shared mockData order) → reuse the pricing.faq* keys. */
const FAQ_Q_KEYS: TranslationKey[] = [
  'pricing.faq1Q',
  'pricing.faq2Q',
  'pricing.faq3Q',
  'pricing.faq4Q',
  'pricing.faq5Q',
]
const FAQ_A_KEYS: TranslationKey[] = [
  'pricing.faq1A',
  'pricing.faq2A',
  'pricing.faq3A',
  'pricing.faq4A',
  'pricing.faq5A',
]

function Hero() {
  const navigate = useNavigate()
  const t = useT()

  return (
    <section className="relative flex min-h-screen items-center overflow-hidden px-4 pb-20 pt-28 md:px-6">
      <AnimatedBackground variant="default" />

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        {/* Copy */}
        <motion.div
          variants={staggerContainer(0.1, 0.1)}
          initial="hidden"
          animate="show"
          className="text-center lg:text-left"
        >
          <motion.div variants={popIn} className="inline-flex">
            <Badge tone="ai" dot className="px-3 py-1 text-[13px]">
              {t('landing.heroBadge')}
            </Badge>
          </motion.div>

          <motion.h1
            variants={fadeUpLg}
            className="mt-5 text-balance text-4xl font-extrabold leading-[1.05] tracking-tight text-slate-900 sm:text-5xl md:text-6xl lg:text-[4.2rem]"
          >
            {t('landing.heroTitle1')}
            <br />
            <span className="text-aurora animate-gradient-x">{t('landing.heroTitle2')}</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mx-auto mt-6 max-w-xl text-pretty text-base text-slate-500 sm:text-lg lg:mx-0"
          >
            {t('landing.heroSubtitle')}
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start"
          >
            <Button
              size="lg"
              variant="primary"
              onClick={() => navigate('/app')}
              className="w-full sm:w-auto"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              {t('landing.heroCtaStart')}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="glass"
              onClick={() => navigate('/app')}
              className="w-full sm:w-auto"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <PlayCircle className="h-4 w-4" />
              {t('landing.heroCtaDemo')}
            </Button>
          </motion.div>

          <motion.div variants={fadeUp} className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-400 lg:justify-start">
            <Check className="h-3.5 w-3.5 text-mint-400" />
            {t('landing.heroNoCard')}
          </motion.div>

          {/* Hero stats */}
          <motion.div
            variants={staggerContainer(0.08, 0.2)}
            className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4"
          >
            {heroStats.map((s) => (
              <motion.div key={s.label} variants={fadeUp} className="text-center lg:text-left">
                <p className="text-2xl font-extrabold tracking-tight text-gradient md:text-3xl">
                  {heroStatValueKeys[s.value] ? t(heroStatValueKeys[s.value]) : s.value}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">{t(heroStatLabelKeys[s.label])}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* App preview mock */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ ...spring, delay: 0.25 }}
          className="relative mx-auto w-full max-w-md"
        >
          {/* glow */}
          <div className="absolute inset-0 -z-10 rounded-[2rem] bg-gradient-brand opacity-30 blur-3xl" />

          <div className="animate-float">
            <GlassCard glow className="overflow-hidden p-0">
              {/* window header */}
              <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-candy-500/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-sun-500/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-mint-500/70" />
                <span className="ml-2 text-xs font-semibold text-slate-400">{t('landing.mockAppLabel')}</span>
                <AIChip className="ml-auto" />
              </div>

              <div className="space-y-3 p-4">
                {/* user bubble */}
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-gradient-brand px-3.5 py-2.5 text-sm font-medium text-white shadow-glow">
                    {t('landing.mockUserMsg')}
                  </div>
                </div>

                {/* assistant bubble */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, ...softSpring }}
                  className="max-w-[88%] rounded-2xl rounded-tl-sm glass-strong px-3.5 py-3 text-sm text-slate-700"
                >
                  {t('landing.mockAiMsg')}
                  <span className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-0.5 bg-grape-400 animate-blink" />
                </motion.div>

                {/* sources / files */}
                <div className="space-y-2 rounded-2xl bg-slate-50 p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    {t('landing.mockSourcesLabel')}
                  </p>
                  {[
                    { nameKey: 'landing.mockFile1' as TranslationKey, type: 'pdf' as const, rel: 0.96, tone: 'indigo' as Tone },
                    { nameKey: 'landing.mockFile2' as TranslationKey, type: 'sheet' as const, rel: 0.91, tone: 'emerald' as Tone },
                  ].map((f) => (
                    <div key={f.nameKey} className="flex items-center gap-2.5">
                      <div className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-lg', tone(f.tone).soft)}>
                        <FileTypeIcon type={f.type} className="h-4 w-4" />
                      </div>
                      <span className="flex-1 truncate text-xs font-semibold text-slate-700">{t(f.nameKey)}</span>
                      <Badge tone="mint" className="text-[10px]">{Math.round(f.rel * 100)}%</Badge>
                    </div>
                  ))}
                </div>

                {/* confidence */}
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                  <span className="text-xs font-semibold text-slate-500">{t('landing.mockConfidence')}</span>
                  <ConfidenceMeter value={0.94} />
                </div>
              </div>
            </GlassCard>
          </div>

          {/* floating decorative file chips */}
          {floatingChips.map((c) => (
            <motion.div
              key={c.labelKey}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + c.delay, type: 'spring', stiffness: 400, damping: 15 }}
              className={cn('absolute hidden md:block', c.className)}
            >
              <div className="animate-float-slow">
                <div className="flex items-center gap-2 rounded-2xl glass-strong px-3 py-2 shadow-card">
                  <FileTypeIcon type={c.type} className="h-4 w-4 text-indigo-500" />
                  <span className="text-xs font-semibold text-slate-700">{t(c.labelKey)}</span>
                </div>
              </div>
            </motion.div>
          ))}

          {/* sparkle */}
          <motion.div
            animate={{ rotate: [0, 20, -10, 0], scale: [1, 1.15, 1] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute -right-3 top-1/2 hidden text-grape-400 md:block"
          >
            <Sparkles className="h-7 w-7" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

/* ========================= LOGO MARQUEE ========================= */

const partners = ['FPT', 'VNG', 'Tiki', 'MoMo', 'Zalo', 'Shopee', 'Got It', 'Base']

function LogoMarquee() {
  const t = useT()
  const row = [...partners, ...partners]
  return (
    <section className="relative border-y border-slate-200 bg-surface-1/40 py-10">
      <p className="mb-7 text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
        {t('landing.trustedBy')}
      </p>
      <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
        <div className="flex w-max animate-marquee gap-12 pr-12">
          {row.map((name, i) => (
            <span
              key={`${name}-${i}`}
              className="select-none whitespace-nowrap text-2xl font-extrabold tracking-tight text-slate-300 transition-colors hover:text-slate-600 md:text-3xl"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ============================ SECTION HEADING ============================ */

function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string
  title: React.ReactNode
  subtitle?: string
}) {
  return (
    <motion.div
      variants={staggerContainer(0.08)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-80px' }}
      className="mx-auto mb-12 max-w-2xl text-center md:mb-16"
    >
      <motion.div variants={fadeUp} className="mb-3 inline-flex">
        <Badge tone="ai">{eyebrow}</Badge>
      </motion.div>
      <motion.h2
        variants={fadeUp}
        className="text-balance text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl lg:text-[2.75rem]"
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p variants={fadeUp} className="mt-4 text-pretty text-base text-slate-500 md:text-lg">
          {subtitle}
        </motion.p>
      )}
    </motion.div>
  )
}

/* ============================ FEATURES (BENTO) ============================ */

interface Feature {
  icon: LucideIcon
  titleKey: TranslationKey
  descKey: TranslationKey
  tone: Tone
  span: string
  flourish?: React.ReactNode
}

const features: Feature[] = [
  {
    icon: Search,
    titleKey: 'landing.feat.semanticTitle',
    descKey: 'landing.feat.semanticDesc',
    tone: 'indigo',
    span: 'md:col-span-2 md:row-span-2',
  },
  {
    icon: MessageSquareText,
    titleKey: 'landing.feat.ragTitle',
    descKey: 'landing.feat.ragDesc',
    tone: 'violet',
    span: 'md:col-span-2',
  },
  {
    icon: FileText,
    titleKey: 'landing.feat.summaryTitle',
    descKey: 'landing.feat.summaryDesc',
    tone: 'emerald',
    span: '',
  },
  {
    icon: Network,
    titleKey: 'landing.feat.knowledgeTitle',
    descKey: 'landing.feat.knowledgeDesc',
    tone: 'amber',
    span: '',
  },
  {
    icon: FolderTree,
    titleKey: 'landing.feat.folderTitle',
    descKey: 'landing.feat.folderDesc',
    tone: 'blue',
    span: 'md:col-span-2',
  },
  {
    icon: ShieldCheck,
    titleKey: 'landing.feat.securityTitle',
    descKey: 'landing.feat.securityDesc',
    tone: 'rose',
    span: '',
  },
]

function FeatureTile({ feature, large }: { feature: Feature; large?: boolean }) {
  const t = useT()
  const Icon = feature.icon
  return (
    <motion.div variants={fadeUp} className={cn('min-h-[200px]', feature.span)}>
      <GlassCard interactive glow={large} className="group flex h-full flex-col overflow-hidden">
        <div
          className={cn(
            'grid place-items-center rounded-2xl',
            tone(feature.tone).soft,
            large ? 'h-16 w-16' : 'h-12 w-12',
          )}
        >
          <Icon className={cn(large ? 'h-8 w-8' : 'h-6 w-6')} />
        </div>

        <h3 className={cn('mt-4 font-extrabold tracking-tight text-slate-900', large ? 'text-2xl' : 'text-lg')}>
          {t(feature.titleKey)}
        </h3>
        <p className={cn('mt-2 text-slate-500', large ? 'text-base' : 'text-sm')}>{t(feature.descKey)}</p>

        {/* extra-rich flourish for the largest tile */}
        {large && (
          <div className="mt-auto pt-6">
            <div className="rounded-2xl border border-slate-200 bg-surface-0/50 p-4">
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
                <Search className="h-4 w-4 text-indigo-500" />
                <span className="text-sm text-slate-600">
                  {t('landing.feat.demoQuery')}
                  <span className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-0.5 bg-grape-400 animate-blink" />
                </span>
              </div>
              <div className="mt-3 space-y-2">
                {searchResults.slice(0, 2).map((r: SearchResult) => (
                  <div
                    key={r.file.id}
                    className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-2.5 py-2"
                  >
                    <div
                      className={cn(
                        'grid h-8 w-8 shrink-0 place-items-center rounded-lg',
                        tone(r.file.tone).soft,
                      )}
                    >
                      <FileTypeIcon type={r.file.type} className="h-4 w-4" />
                    </div>
                    <span className="flex-1 truncate text-xs font-semibold text-slate-700">
                      {r.file.name}
                    </span>
                    <Badge tone="mint" className="text-[10px]">
                      {Math.round(r.relevance * 100)}%
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </GlassCard>
    </motion.div>
  )
}

function Features() {
  const t = useT()
  return (
    <section id="features" className="relative px-4 py-24 md:px-6 md:py-32">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow={t('landing.featuresEyebrow')}
          title={t('landing.featuresTitle')}
          subtitle={t('landing.featuresSubtitle')}
        />

        <motion.div
          variants={staggerContainer(0.07)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 md:auto-rows-[minmax(0,1fr)]"
        >
          {features.map((f, i) => (
            <FeatureTile key={f.titleKey} feature={f} large={i === 0} />
          ))}
        </motion.div>
      </div>
    </section>
  )
}

/* ============================ HOW IT WORKS ============================ */

const steps = [
  {
    icon: UploadCloud,
    titleKey: 'landing.step.uploadTitle' as TranslationKey,
    descKey: 'landing.step.uploadDesc' as TranslationKey,
    tone: 'indigo' as Tone,
  },
  {
    icon: Sparkles,
    titleKey: 'landing.step.analyzeTitle' as TranslationKey,
    descKey: 'landing.step.analyzeDesc' as TranslationKey,
    tone: 'violet' as Tone,
  },
  {
    icon: Compass,
    titleKey: 'landing.step.exploreTitle' as TranslationKey,
    descKey: 'landing.step.exploreDesc' as TranslationKey,
    tone: 'amber' as Tone,
  },
]

function HowItWorks() {
  const t = useT()
  return (
    <section id="how" className="relative px-4 py-24 md:px-6 md:py-32">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow={t('landing.howEyebrow')}
          title={t('landing.howTitle')}
          subtitle={t('landing.howSubtitle')}
        />

        <div className="relative">
          {/* connector line */}
          <div className="absolute left-0 right-0 top-9 hidden h-[2px] bg-slate-200 md:block" />

          <motion.div
            variants={staggerContainer(0.12)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            className="grid gap-8 md:grid-cols-3"
          >
            {steps.map((step, i) => {
              const Icon = step.icon
              return (
                <motion.div key={step.titleKey} variants={fadeUp} className="relative text-center">
                  <div className="relative z-10 mx-auto inline-grid">
                    <div
                      className={cn(
                        'relative grid h-[72px] w-[72px] place-items-center rounded-2xl',
                        tone(step.tone).soft,
                      )}
                    >
                      <Icon className="h-8 w-8" />
                      <span className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-surface-0 text-sm font-extrabold text-slate-700 ring-2 ring-slate-200">
                        {i + 1}
                      </span>
                    </div>
                  </div>
                  <h3 className="mt-5 text-xl font-extrabold tracking-tight text-slate-900">{t(step.titleKey)}</h3>
                  <p className="mx-auto mt-2 max-w-xs text-sm text-slate-500">{t(step.descKey)}</p>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </div>
    </section>
  )
}

/* ===================== INTERACTIVE SHOWCASE ===================== */

const typedQueryKeys: TranslationKey[] = [
  'landing.query.rag',
  'landing.query.revenue',
  'landing.query.podcast',
  'landing.query.ui',
]

function useTypewriter(phrases: string[]) {
  const [text, setText] = useState('')
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const current = phrases[phraseIndex]
    let timeout: ReturnType<typeof setTimeout>

    if (!deleting && text === current) {
      timeout = setTimeout(() => setDeleting(true), 1800)
    } else if (deleting && text === '') {
      setDeleting(false)
      setPhraseIndex((p) => (p + 1) % phrases.length)
    } else {
      timeout = setTimeout(
        () => {
          setText((t) =>
            deleting ? current.slice(0, t.length - 1) : current.slice(0, t.length + 1),
          )
        },
        deleting ? 35 : 65,
      )
    }

    return () => clearTimeout(timeout)
  }, [text, deleting, phraseIndex, phrases])

  return text
}

function Showcase() {
  const t = useT()
  const phrases = useMemo(() => typedQueryKeys.map((k) => t(k)), [t])
  const typed = useTypewriter(phrases)

  return (
    <section className="relative px-4 py-24 md:px-6 md:py-32">
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          eyebrow={t('landing.showcaseEyebrow')}
          title={t('landing.showcaseTitle')}
          subtitle={t('landing.showcaseSubtitle')}
        />

        <motion.div
          variants={scaleIn}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
        >
          <GlassCard glow className="overflow-hidden p-0">
            {/* search bar */}
            <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4 md:px-6">
              <Search className="h-5 w-5 shrink-0 text-indigo-500" />
              <div className="flex-1 text-base text-slate-800 md:text-lg">
                {typed}
                <span className="ml-0.5 inline-block h-5 w-[2px] translate-y-1 bg-grape-400 animate-blink" />
              </div>
              <Badge tone="ai" className="hidden sm:inline-flex">
                <Zap className="h-3 w-3" /> {t('landing.showcaseSemantic')}
              </Badge>
            </div>

            {/* results */}
            <div className="grid gap-4 p-5 md:grid-cols-3 md:p-6">
              {searchResults.map((r: SearchResult, i) => (
                <motion.div
                  key={r.file.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.12, ...softSpring }}
                >
                  <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-colors hover:border-indigo-200 hover:bg-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={cn(
                          'grid h-10 w-10 shrink-0 place-items-center rounded-xl',
                          tone(r.file.tone).soft,
                        )}
                      >
                        <FileTypeIcon type={r.file.type} className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900">{r.file.name}</p>
                        <p className="text-[11px] text-slate-400">{t('landing.showcaseRelevance')}</p>
                      </div>
                    </div>

                    <ProgressBar
                      progress={Math.round(r.relevance * 100)}
                      gradient={tone(r.file.tone).dot}
                      className="mt-3"
                    />

                    <p className="mt-3 line-clamp-3 text-xs text-slate-500">{r.snippet}</p>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {r.matchedConcepts.slice(0, 2).map((c) => (
                        <Badge key={c} tone="brand" className="text-[10px]">
                          {c}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </section>
  )
}

/* ============================ TESTIMONIALS ============================ */

function Testimonials() {
  const t = useT()
  return (
    <section id="testimonials" className="relative px-4 py-24 md:px-6 md:py-32">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow={t('landing.testimonialsEyebrow')}
          title={t('landing.testimonialsTitle')}
          subtitle={t('landing.testimonialsSubtitle')}
        />

        <motion.div
          variants={staggerContainer(0.08)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {testimonials.map((item) => (
            <motion.div key={item.id} variants={fadeUp}>
              <GlassCard interactive className="flex h-full flex-col">
                <Quote className="h-7 w-7 text-grape-400/50" />
                <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-700">
                  {TESTI_KEYS[item.id] ? t(TESTI_KEYS[item.id].quote) : item.quote}
                </p>

                <div className="mt-5 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-sun-400 text-sun-400" />
                  ))}
                </div>

                <div className="mt-4 flex items-center gap-3 border-t border-slate-200 pt-4">
                  <Avatar initials={item.initials} tone={item.tone} size="sm" />
                  <div>
                    <p className="text-sm font-bold text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-400">
                      {TESTI_KEYS[item.id] ? t(TESTI_KEYS[item.id].role) : item.role}
                    </p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

/* ============================ PRICING TEASER ============================ */

function PricingTeaser() {
  const t = useT()
  const pro = pricingPlans[1]
  return (
    <section className="relative px-4 py-24 md:px-6 md:py-32">
      <div className="mx-auto max-w-5xl">
        <motion.div
          variants={scaleIn}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
        >
          <GlassCard glow className="relative overflow-hidden p-0">
            <div className="grid items-center gap-8 p-8 md:grid-cols-2 md:p-12">
              <div>
                <Badge tone="ai" className="mb-4">{t('landing.pricingPopular')}</Badge>
                <h3 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
                  {t('landing.pricingPlanTitle', { name: pro.name })}
                </h3>
                <p className="mt-2 text-slate-500">{t('pricing.planProTagline')} — {t('landing.pricingTaglineSuffix')}</p>

                <div className="mt-6 flex items-end gap-2">
                  <span className="text-5xl font-extrabold tracking-tight text-slate-900">
                    {formatNumber(pro.priceMonthly)}đ
                  </span>
                  <span className="mb-1.5 text-slate-400">{t('landing.perMonth')}</span>
                </div>
                <p className="mt-1 text-sm text-mint-400">
                  {t('landing.pricingYearly', { price: formatNumber(pro.priceYearly) })}
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link to="/pricing" className="sm:w-auto">
                    <Button size="lg" variant="primary" className="w-full sm:w-auto" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                      {t('landing.viewPricing')}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to="/app" className="sm:w-auto">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto">
                      {t('landing.tryPro')}
                    </Button>
                  </Link>
                </div>
              </div>

              {/* feature list */}
              <div className="rounded-3xl border border-slate-200 bg-surface-0/40 p-6">
                <p className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900">
                  <Sparkles className="h-4 w-4 text-indigo-500" />
                  {pro.storage} · {t('landing.pricingIncluded')}
                </p>
                <ul className="space-y-3">
                  {pro.features.map((f, i) => (
                    <li key={f.text} className="flex items-center gap-3 text-sm">
                      <span
                        className={cn(
                          'grid h-5 w-5 shrink-0 place-items-center rounded-full',
                          f.included ? 'bg-mint-500/20 text-mint-400' : 'bg-slate-100 text-slate-400',
                        )}
                      >
                        {f.included ? <Check className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                      </span>
                      <span className={cn(f.included ? 'text-slate-700' : 'text-slate-400 line-through')}>
                        {PRO_FEATURE_KEYS[i] ? t(PRO_FEATURE_KEYS[i]) : f.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </section>
  )
}

/* ============================ FAQ ============================ */

function FAQ() {
  const t = useT()
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section className="relative px-4 py-24 md:px-6 md:py-32">
      <div className="mx-auto max-w-3xl">
        <SectionHeading
          eyebrow={t('landing.faqEyebrow')}
          title={t('landing.faqTitle')}
        />

        <motion.div
          variants={staggerContainer(0.06)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="space-y-3"
        >
          {faqs.map((faq, i) => {
            const isOpen = open === i
            return (
              <motion.div key={faq.q} variants={fadeUp}>
                <div
                  className={cn(
                    'overflow-hidden rounded-2xl border transition-colors',
                    isOpen ? 'border-indigo-200 glass-strong' : 'border-slate-200 glass',
                  )}
                >
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  >
                    <span className="text-sm font-bold text-slate-900 md:text-base">
                      {FAQ_Q_KEYS[i] ? t(FAQ_Q_KEYS[i]) : faq.q}
                    </span>
                    <span
                      className={cn(
                        'grid h-7 w-7 shrink-0 place-items-center rounded-full transition-colors',
                        isOpen ? 'bg-gradient-brand text-white' : 'bg-slate-100 text-slate-600',
                      )}
                    >
                      {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="px-5 pb-5 text-sm leading-relaxed text-slate-500">
                          {FAQ_A_KEYS[i] ? t(FAQ_A_KEYS[i]) : faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}

/* ============================ FINAL CTA ============================ */

function FinalCTA() {
  const navigate = useNavigate()
  const t = useT()
  return (
    <section className="relative px-4 py-24 md:px-6 md:py-32">
      <div className="mx-auto max-w-6xl">
        <motion.div
          variants={scaleIn}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="relative overflow-hidden rounded-4xl bg-gradient-brand px-6 py-16 text-center shadow-glow md:px-12 md:py-24"
        >
          <div className="pointer-events-none absolute inset-0 bg-mesh opacity-40" />
          <div className="pointer-events-none absolute inset-0 grain" />

          {/* floating sparkles */}
          <motion.div
            animate={{ y: [0, -14, 0], rotate: [0, 15, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
            className="absolute left-[12%] top-[18%] hidden text-white/40 md:block"
          >
            <Sparkles className="h-8 w-8" />
          </motion.div>
          <motion.div
            animate={{ y: [0, 16, 0], rotate: [0, -12, 0] }}
            transition={{ duration: 6, repeat: Infinity }}
            className="absolute right-[14%] bottom-[20%] hidden text-white/30 md:block"
          >
            <Sparkles className="h-6 w-6" />
          </motion.div>

          <div className="relative">
            <Badge tone="neutral" className="mb-5 border-white/20 bg-white/10 text-white">
              {t('landing.ctaBadge')}
            </Badge>
            <h2 className="text-balance text-3xl font-extrabold leading-tight tracking-tight text-white md:text-5xl">
              {t('landing.ctaTitle')}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-base text-white/80 md:text-lg">
              {t('landing.ctaSubtitle')}
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                variant="glass"
                onClick={() => navigate('/app')}
                className="w-full border-white/30 bg-white text-ink-700 hover:bg-white/90 sm:w-auto"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
              >
                {t('landing.heroCtaStart')}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Link to="/pricing" className="sm:w-auto">
                <Button size="lg" variant="ghost" className="w-full text-white hover:bg-white/15 sm:w-auto">
                  {t('landing.viewPricing')}
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

/* ============================ PAGE ============================ */

export function LandingPage() {
  return (
    <MarketingLayout>
      <MarketingNav />
      <main>
        <Hero />
        <LogoMarquee />
        <Features />
        <HowItWorks />
        <Showcase />
        <Testimonials />
        <PricingTeaser />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </MarketingLayout>
  )
}