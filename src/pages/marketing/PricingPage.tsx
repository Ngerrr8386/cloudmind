import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check,
  Minus,
  Sparkles,
  Crown,
  Rocket,
  Zap,
  ShieldCheck,
  GraduationCap,
  ChevronDown,
  ArrowRight,
  HeartHandshake,
} from 'lucide-react'
import {
  Button,
  Badge,
  GlassCard,
  GradientBorderCard,
  AIChip,
  AnimatedBackground,
} from '@/components/ui'
import { MarketingNav } from '@/components/layout/MarketingNav'
import { Footer, MarketingLayout } from '@/components/layout/Footer'
import { pricingPlans, faqs } from '@/lib/mockData'
import type { PricingPlan } from '@/lib/types'
import { useAuth } from '@/lib/auth'
import { api, ApiError } from '@/lib/api'
import { cn, formatNumber } from '@/lib/utils'
import { tone } from '@/lib/theme'
import {
  staggerContainer,
  fadeUp,
  fadeUpLg,
  scaleIn,
  popIn,
  spring,
  softSpring,
} from '@/lib/motion'

/* ------------------------------------------------------------------ */
/* helpers                                                            */
/* ------------------------------------------------------------------ */

const planIcon: Record<string, typeof Zap> = {
  free: Zap,
  pro: Crown,
  team: Rocket,
}

function priceLabel(plan: PricingPlan, yearly: boolean) {
  const value = yearly ? plan.priceYearly : plan.priceMonthly
  if (value === 0) return 'Miễn phí'
  return `${formatNumber(value)}đ`
}

/* ------------------------------------------------------------------ */
/* feature comparison matrix                                          */
/* ------------------------------------------------------------------ */

type Cell = boolean | string

const comparisonRows: { label: string; cells: [Cell, Cell, Cell] }[] = [
  { label: 'Dung lượng lưu trữ', cells: ['15 GB', '500 GB', '2 TB / người'] },
  { label: 'Tìm kiếm ngữ nghĩa', cells: ['Cơ bản', 'Nâng cao', 'Nâng cao'] },
  { label: 'Hỏi đáp AI', cells: ['20 / tháng', 'Không giới hạn', 'Không giới hạn'] },
  { label: 'Tóm tắt & trích xuất tự động', cells: [false, true, true] },
  { label: 'Gợi ý thư mục thông minh', cells: [false, true, true] },
  { label: 'Khai thác tri thức nâng cao', cells: [false, false, true] },
  { label: 'Không gian làm việc chung', cells: [false, false, true] },
  { label: 'Phân quyền & nhật ký', cells: [false, false, true] },
  { label: 'Hỗ trợ ưu tiên 24/7', cells: [false, 'Email', true] },
]

function CompCell({ value }: { value: Cell }) {
  if (value === true) {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-mint-500/15 text-mint-400">
        <Check className="h-4 w-4" strokeWidth={3} />
      </span>
    )
  }
  if (value === false) {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-300">
        <Minus className="h-4 w-4" />
      </span>
    )
  }
  return <span className="text-sm font-medium text-slate-700">{value}</span>
}

/* ------------------------------------------------------------------ */
/* FAQ accordion item                                                 */
/* ------------------------------------------------------------------ */

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <motion.div variants={fadeUp}>
      <GlassCard
        interactive
        className={cn(
          'overflow-hidden p-0 transition-colors',
          open && 'border-grape-500/40',
        )}
        onClick={() => setOpen((v) => !v)}
      >
        <button
          type="button"
          className="flex w-full items-center gap-4 px-5 py-5 text-left sm:px-6"
        >
          <span
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors',
              open ? 'bg-gradient-brand text-white' : 'bg-slate-100 text-slate-600',
            )}
          >
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="flex-1 text-base font-semibold text-slate-900 sm:text-lg">
            {q}
          </span>
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={softSpring}
            className="shrink-0 text-slate-500"
          >
            <ChevronDown className="h-5 w-5" />
          </motion.span>
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="px-5 pb-5 pl-[4.25rem] text-sm leading-relaxed text-slate-600 sm:px-6 sm:pb-6 sm:text-base">
                {a}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/* plan card                                                          */
/* ------------------------------------------------------------------ */

function PlanCard({
  plan,
  yearly,
  onPick,
}: {
  plan: PricingPlan
  yearly: boolean
  onPick: () => void
}) {
  const Icon = planIcon[plan.id] ?? Zap
  const isFree = plan.priceMonthly === 0

  const inner = (
    <div
      className={cn(
        'relative flex h-full flex-col gap-6 rounded-3xl p-6 sm:p-7',
        plan.highlight ? 'bg-surface-1' : 'glass',
      )}
    >
      {plan.highlight && (
        <div className="pointer-events-none absolute -right-px -top-px overflow-hidden rounded-bl-2xl rounded-tr-3xl">
          <div className="bg-gradient-brand px-4 py-1.5 text-xs font-bold text-white shadow-glow">
            Phổ biến nhất ✨
          </div>
        </div>
      )}

      {/* head */}
      <div className="flex items-center gap-3">
        <span
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-2xl shadow-card',
            tone(plan.tone).soft,
          )}
        >
          <Icon className="h-6 w-6" />
        </span>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-extrabold text-slate-900">{plan.name}</h3>
            {plan.badge && !plan.highlight && (
              <Badge tone="mint">{plan.badge}</Badge>
            )}
          </div>
          <p className="text-sm text-slate-500">{plan.tagline}</p>
        </div>
      </div>

      {/* price */}
      <div>
        <div className="flex items-end gap-1">
          <motion.span
            key={`${plan.id}-${yearly}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring}
            className={cn(
              'text-4xl font-black tracking-tight sm:text-5xl',
              plan.highlight ? 'text-gradient' : 'text-slate-900',
            )}
          >
            {priceLabel(plan, yearly)}
          </motion.span>
          {!isFree && (
            <span className="mb-1.5 text-sm font-medium text-slate-500">/tháng</span>
          )}
        </div>
        <p className="mt-1 text-xs text-slate-500">
          {isFree
            ? 'Không cần thẻ, cứ vào dùng thôi 😎'
            : yearly
              ? 'Thanh toán theo năm · đã gồm ưu đãi'
              : 'Thanh toán hàng tháng · hủy bất cứ lúc nào'}
        </p>
        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700">
          <ShieldCheck className="h-4 w-4 text-mint-400" />
          {plan.storage}
        </div>
      </div>

      {/* features */}
      <ul className="flex-1 space-y-3">
        {plan.features.map((f) => (
          <li key={f.text} className="flex items-start gap-3 text-sm">
            <span
              className={cn(
                'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                f.included
                  ? 'bg-mint-500/15 text-mint-400'
                  : 'bg-slate-100 text-slate-300',
              )}
            >
              {f.included ? (
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              ) : (
                <Minus className="h-3.5 w-3.5" />
              )}
            </span>
            <span className={cn(f.included ? 'text-slate-700' : 'text-slate-400')}>
              {f.text}
            </span>
          </li>
        ))}
      </ul>

      {/* cta */}
      <Button
        variant={plan.highlight ? 'primary' : 'glass'}
        size="lg"
        className="w-full"
        onClick={onPick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {plan.cta}
        <ArrowRight className="ml-1.5 h-4 w-4" />
      </Button>
    </div>
  )

  return (
    <motion.div
      variants={fadeUpLg}
      whileHover={{ y: -8 }}
      transition={softSpring}
      className={cn(
        'h-full',
        plan.highlight && 'relative z-10 lg:-my-3 lg:scale-[1.04]',
      )}
    >
      {plan.highlight ? (
        <div className="h-full shadow-glow">
          <GradientBorderCard
            gradient="from-grape-500 via-candy-500 to-ink-500"
            className="h-full"
          >
            {inner}
          </GradientBorderCard>
        </div>
      ) : (
        inner
      )}
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/* page                                                               */
/* ------------------------------------------------------------------ */

export function PricingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [yearly, setYearly] = useState(true)
  const [toast, setToast] = useState('')

  const goApp = () => navigate(user ? '/app' : '/signup')

  /** Chọn gói: free/chưa đăng nhập → đăng ký; gói trả phí + đã đăng nhập → checkout PayOS. */
  const handlePick = async (plan: PricingPlan) => {
    if (plan.priceMonthly === 0) { navigate(user ? '/app' : '/signup'); return }
    if (!user) { navigate('/login'); return }
    try {
      setToast('Đang tạo phiên thanh toán…')
      const res = await api.checkout({ planKey: plan.id, months: yearly ? 12 : 1 })
      if (res.checkoutUrl) { window.location.href = res.checkoutUrl; return }
      setToast('')
    } catch (e) {
      setToast(e instanceof ApiError ? e.message : 'Không tạo được phiên thanh toán')
      window.setTimeout(() => setToast(''), 4000)
    }
  }

  return (
    <MarketingLayout>
      <MarketingNav />

      {/* ============================ HERO ============================ */}
      <section className="relative overflow-hidden px-4 pb-10 pt-28 sm:px-6 sm:pt-32">
        <AnimatedBackground variant="subtle" />

        <motion.div
          variants={staggerContainer(0.1)}
          initial="hidden"
          animate="show"
          className="relative mx-auto max-w-3xl text-center"
        >
          <motion.div variants={popIn} className="flex justify-center">
            <Badge tone="ai" dot>
              Bảng giá
            </Badge>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="mt-5 text-4xl font-black leading-[1.05] tracking-tight text-slate-900 sm:text-5xl md:text-6xl"
          >
            Chọn gói hợp với{' '}
            <span className="text-gradient">vibe của bạn</span> 💜
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mx-auto mt-5 max-w-xl text-base text-slate-600 sm:text-lg"
          >
            Từ học sinh tay ngang tới team làm thật — CloudMind có gói cho mọi
            level. Nâng cấp khi cần, hạ cấp khi chill, không ràng buộc gì hết.
          </motion.p>

          {/* billing toggle */}
          <motion.div
            variants={scaleIn}
            className="mt-8 inline-flex items-center gap-4 rounded-full glass-strong px-5 py-3"
          >
            <button
              type="button"
              onClick={() => setYearly(false)}
              className={cn(
                'text-sm font-semibold transition-colors',
                !yearly ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700',
              )}
            >
              Hàng tháng
            </button>

            <BillingToggle checked={yearly} onChange={setYearly} />

            <button
              type="button"
              onClick={() => setYearly(true)}
              className={cn(
                'flex items-center gap-2 text-sm font-semibold transition-colors',
                yearly ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700',
              )}
            >
              Theo năm
              <AnimatePresence>
                {yearly && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    transition={spring}
                  >
                    <Badge tone="mint">tiết kiệm ~20%</Badge>
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </motion.div>
        </motion.div>

        {/* ============================ PLAN CARDS ============================ */}
        <motion.div
          variants={staggerContainer(0.12, 0.1)}
          initial="hidden"
          animate="show"
          className="relative mx-auto mt-12 grid max-w-6xl grid-cols-1 items-stretch gap-6 sm:mt-14 md:grid-cols-2 lg:grid-cols-3"
        >
          {pricingPlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              yearly={yearly}
              onPick={() => handlePick(plan)}
            />
          ))}
        </motion.div>

        <p className="relative mx-auto mt-6 max-w-md text-center text-xs text-slate-400">
          Giá đã gồm VAT. Mọi gói đều có 14 ngày dùng thử Pro miễn phí, không cần
          nhập thẻ.
        </p>
      </section>

      {/* ============================ STUDENT BAND ============================ */}
      <section className="px-4 py-10 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={spring}
          className="mx-auto max-w-6xl"
        >
          <GradientBorderCard gradient="from-mint-500 via-sky2-500 to-grape-500">
            <div className="relative flex flex-col items-center gap-6 overflow-hidden rounded-3xl bg-surface-1 p-7 text-center sm:flex-row sm:p-9 sm:text-left">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-mint-500/20 blur-3xl" />
              <motion.span
                animate={{ rotate: [0, -8, 8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-gradient-mint text-white shadow-glow-mint"
              >
                <GraduationCap className="h-8 w-8" />
              </motion.span>

              <div className="relative flex-1">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <h2 className="text-2xl font-black text-slate-900 sm:text-3xl">
                    Sinh viên giảm{' '}
                    <span className="text-gradient-mint">50%</span> gói Pro 🎓
                  </h2>
                  <Badge tone="mint" dot>
                    Ưu đãi hot
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-slate-600 sm:text-base">
                  Xác thực email trường trong 30 giây là có ngay full sức mạnh AI
                  với giá nửa tiền. Học mà có não thứ hai thì còn gì bằng 💪
                </p>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="relative shrink-0"
                onClick={goApp}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Xác thực ngay
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          </GradientBorderCard>
        </motion.div>
      </section>

      {/* ============================ COMPARISON ============================ */}
      <section className="px-4 py-12 sm:px-6 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={spring}
          className="mx-auto max-w-6xl"
        >
          <div className="mb-8 text-center">
            <AIChip label="So kèo từng tính năng" className="mx-auto" />
            <h2 className="mt-4 text-3xl font-black text-slate-900 sm:text-4xl">
              So sánh chi tiết các gói
            </h2>
            <p className="mt-2 text-slate-500">
              Lướt một cái là rõ gói nào hợp với bạn nhất.
            </p>
          </div>

          {/* ---- mobile: stacked cards ---- */}
          <motion.div
            variants={staggerContainer(0.06)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="space-y-4 md:hidden"
          >
            {pricingPlans.map((plan, pi) => (
              <motion.div key={plan.id} variants={fadeUp}>
                <GlassCard className="p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-lg font-extrabold text-slate-900">
                      {plan.name}
                    </span>
                    {plan.highlight && (
                      <Badge tone="brand">Phổ biến nhất</Badge>
                    )}
                  </div>
                  <ul className="space-y-3">
                    {comparisonRows.map((row) => (
                      <li
                        key={row.label}
                        className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3 last:border-0 last:pb-0"
                      >
                        <span className="text-sm text-slate-600">
                          {row.label}
                        </span>
                        <CompCell value={row.cells[pi]} />
                      </li>
                    ))}
                  </ul>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>

          {/* ---- desktop: table ---- */}
          <div className="hidden md:block">
            <GlassCard className="overflow-hidden p-0">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="px-6 py-5 text-left text-sm font-semibold text-slate-500">
                      Tính năng
                    </th>
                    {pricingPlans.map((plan) => (
                      <th
                        key={plan.id}
                        className={cn(
                          'px-6 py-5 text-center',
                          plan.highlight && 'bg-slate-50',
                        )}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className={cn(
                              'text-base font-extrabold',
                              plan.highlight ? 'text-gradient' : 'text-slate-900',
                            )}
                          >
                            {plan.name}
                          </span>
                          {plan.highlight && (
                            <Badge tone="brand">Phổ biến</Badge>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row, ri) => (
                    <tr
                      key={row.label}
                      className={cn(
                        'border-b border-slate-200 transition-colors last:border-0 hover:bg-slate-100',
                        ri % 2 === 1 && 'bg-slate-50',
                      )}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-slate-700">
                        {row.label}
                      </td>
                      {row.cells.map((cell, ci) => (
                        <td
                          key={ci}
                          className={cn(
                            'px-6 py-4 text-center',
                            pricingPlans[ci].highlight && 'bg-slate-50',
                          )}
                        >
                          <div className="flex justify-center">
                            <CompCell value={cell} />
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </GlassCard>
          </div>
        </motion.div>
      </section>

      {/* ============================ FAQ ============================ */}
      <section className="px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={spring}
            className="mb-8 text-center"
          >
            <Badge tone="candy" dot>
              Hỏi xoáy đáp xoay
            </Badge>
            <h2 className="mt-4 text-3xl font-black text-slate-900 sm:text-4xl">
              Thắc mắc thường gặp 🤔
            </h2>
            <p className="mt-2 text-slate-500">
              Chưa rõ chỗ nào? Đây là những câu mọi người hay hỏi nhất.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer(0.08)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            className="space-y-3"
          >
            {faqs.map((f) => (
              <FaqItem key={f.q} q={f.q} a={f.a} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============================ FINAL CTA ============================ */}
      <section className="px-4 pb-20 pt-6 sm:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={spring}
          className="mx-auto max-w-5xl"
        >
          <div className="relative overflow-hidden rounded-4xl bg-gradient-aurora p-[1.5px] shadow-glow">
            <div className="relative overflow-hidden rounded-[calc(2rem-1.5px)] bg-surface-1 px-6 py-12 text-center sm:px-12 sm:py-16">
              <div className="grain pointer-events-none absolute inset-0 opacity-40" />
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                className="pointer-events-none absolute -left-6 top-8 hidden text-grape-400/40 sm:block"
              >
                <HeartHandshake className="h-16 w-16" />
              </motion.div>
              <motion.div
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                className="pointer-events-none absolute -right-4 bottom-8 hidden text-candy-400/40 sm:block"
              >
                <Sparkles className="h-14 w-14" />
              </motion.div>

              <div className="relative">
                <AIChip label="Bắt đầu trong 30 giây" className="mx-auto" />
                <h2 className="mt-5 text-3xl font-black leading-tight text-slate-900 sm:text-4xl md:text-5xl">
                  Sẵn sàng nâng cấp{' '}
                  <span className="text-gradient">não thứ hai</span> chưa? 🧠
                </h2>
                <p className="mx-auto mt-4 max-w-lg text-base text-slate-600 sm:text-lg">
                  Đăng ký miễn phí, dùng thử Pro 14 ngày. Không thích thì hủy
                  trong 1 chạm — chẳng mất gì cả.
                </p>
                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={goApp}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                  >
                    Dùng thử miễn phí
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                  <Button
                    variant="glass"
                    size="lg"
                    onClick={goApp}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                  >
                    Xem demo trước
                  </Button>
                </div>
                <p className="mt-5 text-xs text-slate-400">
                  Đã có hơn 180K người dùng đang xây kho tri thức của họ trên
                  CloudMind 💜
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <Footer />

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-xl"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </MarketingLayout>
  )
}

/* ------------------------------------------------------------------ */
/* tiny inline billing toggle (animated track + knob)                 */
/* ------------------------------------------------------------------ */

function BillingToggle({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label="Đổi chu kỳ thanh toán"
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-7 w-12 shrink-0 rounded-full transition-colors ring-focus',
        checked ? 'bg-gradient-brand' : 'bg-slate-200',
      )}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={cn(
          'absolute top-1 h-5 w-5 rounded-full bg-white shadow-md',
          checked ? 'right-1' : 'left-1',
        )}
      />
    </button>
  )
}