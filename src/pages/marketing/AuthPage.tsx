import { useMemo, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/auth'
import { ApiError } from '@/lib/api'
import { useT, type TranslationKey } from '@/lib/i18n'
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher'
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  Sparkles,
  ShieldCheck,
  Brain,
  Zap,
  ArrowRight,
  Quote,
} from 'lucide-react'
import {
  Button,
  Badge,
  GlassCard,
  Avatar,
  Logo,
  Input,
  Toggle,
  AnimatedBackground,
  AIChip,
} from '@/components/ui'
import { testimonials } from '@/lib/mockData'
import { cn } from '@/lib/utils'
import { tone, type Tone } from '@/lib/theme'
import { fadeUp, scaleIn, staggerContainer, softSpring } from '@/lib/motion'

/* ---------- password strength helper ---------- */

type Strength = { score: number; labelKey: TranslationKey | ''; toneClass: string; bar: string }

function evaluatePassword(pw: string): Strength {
  let score = 0
  if (pw.length >= 6) score += 1
  if (pw.length >= 10) score += 1
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 1
  if (/\d/.test(pw)) score += 1
  if (/[^A-Za-z0-9]/.test(pw)) score += 1
  score = Math.min(score, 4)

  if (pw.length === 0) return { score: 0, labelKey: '', toneClass: 'text-slate-400', bar: 'bg-slate-200' }
  if (score <= 1) return { score: 1, labelKey: 'auth.pw.weak', toneClass: 'text-rose-600', bar: 'bg-rose-500' }
  if (score === 2) return { score: 2, labelKey: 'auth.pw.ok', toneClass: 'text-amber-600', bar: 'bg-amber-500' }
  if (score === 3) return { score: 3, labelKey: 'auth.pw.good', toneClass: 'text-blue-600', bar: 'bg-blue-500' }
  return { score: 4, labelKey: 'auth.pw.strong', toneClass: 'text-emerald-600', bar: 'bg-emerald-500' }
}

/* ---------- mini feature bullets ---------- */

const features = [
  { icon: Brain, titleKey: 'auth.feat1Title', descKey: 'auth.feat1Desc', tone: 'indigo' as Tone },
  { icon: Zap, titleKey: 'auth.feat2Title', descKey: 'auth.feat2Desc', tone: 'emerald' as Tone },
  { icon: ShieldCheck, titleKey: 'auth.feat3Title', descKey: 'auth.feat3Desc', tone: 'rose' as Tone },
] as const

/* ---------- social button icons ---------- */

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.4-1 2.6-2.1 3.4l3.4 2.6c2-1.85 3.15-4.57 3.15-7.8 0-.74-.07-1.45-.2-2.13H12Z"
      />
      <path
        fill="#34A853"
        d="M5.27 14.28 4.5 14.86l-2.7 2.1C3.5 20.3 7.46 22.5 12 22.5c2.97 0 5.46-.98 7.28-2.66l-3.4-2.64c-.94.64-2.16 1.02-3.88 1.02-2.98 0-5.5-2-6.4-4.72Z"
      />
      <path
        fill="#4A90D9"
        d="M1.8 6.94A10.46 10.46 0 0 0 1.5 12c0 1.8.44 3.5 1.2 5.06l3.47-2.7A6.3 6.3 0 0 1 5.84 12c0-.82.14-1.6.4-2.34L1.8 6.94Z"
      />
      <path
        fill="#FBBC05"
        d="M12 5.5c1.62 0 3.06.56 4.2 1.65l3.14-3.14C17.46 2.2 14.97 1.5 12 1.5 7.46 1.5 3.5 3.7 1.8 6.94l4.44 3.42C7.14 7.64 9.32 5.5 12 5.5Z"
      />
    </svg>
  )
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M16.37 12.78c.03 3.2 2.8 4.26 2.83 4.27-.02.07-.44 1.52-1.46 3.01-.88 1.29-1.79 2.57-3.23 2.6-1.41.03-1.87-.83-3.48-.83-1.61 0-2.12.8-3.46.86-1.39.05-2.45-1.39-3.34-2.67C2.39 17.4 1 12.6 2.85 9.35c.91-1.61 2.55-2.63 4.33-2.66 1.37-.03 2.65.92 3.48.92.83 0 2.4-1.14 4.04-.97.69.03 2.62.28 3.86 2.1-.1.06-2.3 1.35-2.19 4.04ZM13.7 4.84c.73-.89 1.23-2.12 1.1-3.34-1.05.04-2.33.7-3.09 1.58-.68.78-1.27 2.04-1.11 3.24 1.18.09 2.37-.6 3.1-1.48Z" />
    </svg>
  )
}

/* ---------- main page ---------- */

export function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  const navigate = useNavigate()
  const location = useLocation()
  const auth = useAuth()
  const t = useT()
  const isSignup = mode === 'signup'
  const redirectTo = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/app'

  const [step, setStep] = useState<'form' | 'otp' | 'reset'>('form')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const strength = useMemo(() => evaluatePassword(password), [password])
  const testimonial = testimonials[0]

  // Đã đăng nhập thì không hiện lại form — điều hướng về đích redirect (vd trang lời mời) hoặc vào ứng dụng
  if (!auth.loading && auth.user) {
    return <Navigate to={redirectTo} replace />
  }

  function fail(e: unknown) {
    setError(e instanceof ApiError ? e.message : t('auth.genericError'))
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(''); setInfo(''); setSubmitting(true)
    try {
      if (step === 'otp') {
        await auth.verifyEmail(email, code)
        navigate(redirectTo, { replace: true })
      } else if (step === 'reset') {
        await auth.resetPassword(email, code, newPassword)
        setStep('form'); setCode(''); setNewPassword('')
        setInfo(t('auth.resetSuccess'))
      } else if (isSignup) {
        const res = await auth.register({ email, password, name })
        setStep('otp')
        setInfo(res.devOtp ? t('auth.otpSentDev', { otp: res.devOtp }) : t('auth.otpSent'))
      } else {
        await auth.login(email, password)
        navigate(redirectTo, { replace: true })
      }
    } catch (err) {
      if (err instanceof ApiError && err.code === 'EMAIL_NOT_VERIFIED') {
        try { await auth.resendOtp(email) } catch { /* ignore */ }
        setStep('otp'); setInfo(t('auth.notVerifiedResent'))
      } else fail(err)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleForgot() {
    setError(''); setInfo('')
    if (!email) { setError(t('auth.enterEmailFirst')); return }
    try {
      const res = await auth.forgotPassword(email)
      setStep('reset')
      setInfo(res.devOtp ? t('auth.resetSentDev', { otp: res.devOtp }) : t('auth.resetSent'))
    } catch (err) { fail(err) }
  }

  async function handleResend() {
    setError('')
    try { await auth.resendOtp(email); setInfo(t('auth.otpResent')) } catch (err) { fail(err) }
  }

  async function handleGoogle() {
    setError(''); setInfo(''); setSubmitting(true)
    try {
      await auth.googleLogin()
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : t('auth.googleFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  function socialUnavailable() {
    setError(t('auth.appleSoon'))
  }

  return (
    <div className="relative min-h-screen w-full bg-surface-0 text-slate-800 lg:grid lg:grid-cols-[1.05fr_1fr]">
      <div className="absolute right-4 top-4 z-30">
        <LanguageSwitcher />
      </div>
      {/* ======================= LEFT BRAND PANEL ======================= */}
      <aside className="relative hidden overflow-hidden lg:flex">
        <AnimatedBackground className="absolute inset-0" />
        <div className="absolute inset-0 bg-mesh opacity-50" />
        <div className="absolute inset-0 grain opacity-[0.18]" />
        <div className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-grape-500/10 blur-3xl animate-float-slow" />
        <div className="pointer-events-none absolute -right-16 bottom-10 h-64 w-64 rounded-full bg-mint-500/10 blur-3xl animate-float" />

        <motion.div
          variants={staggerContainer(0.12, 0.1)}
          initial="hidden"
          animate="show"
          className="relative z-10 flex w-full flex-col justify-between p-10 xl:p-14"
        >
          {/* top: logo */}
          <motion.div variants={fadeUp}>
            <Logo size="lg" />
          </motion.div>

          {/* middle: headline + testimonial */}
          <div className="space-y-9 py-10">
            <motion.div variants={fadeUp} className="space-y-5">
              <AIChip label={t('auth.brandChip')} />
              <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900 xl:text-5xl">
                {t('auth.brandTitle1')}
                <br />
                <span className="text-gradient">{t('auth.brandTitle2')}</span>
              </h1>
              <p className="max-w-md text-base leading-relaxed text-slate-600">
                {t('auth.brandDesc')}
              </p>
            </motion.div>

            {/* featured testimonial */}
            <motion.div variants={fadeUp}>
              <GlassCard glow className="relative max-w-md p-6">
                <Quote className="absolute right-5 top-5 h-9 w-9 text-slate-200" />
                <p className="relative text-[15px] leading-relaxed text-slate-700">
                  “{testimonial.quote}”
                </p>
                <div className="mt-5 flex items-center gap-3">
                  <Avatar initials={testimonial.initials} tone={testimonial.tone} size="md" ring />
                  <div className="leading-tight">
                    <p className="text-sm font-semibold text-slate-900">{testimonial.name}</p>
                    <p className="text-xs text-slate-500">{testimonial.role}</p>
                  </div>
                  <Badge tone="mint" className="ml-auto">
                    ⭐ 5.0
                  </Badge>
                </div>
              </GlassCard>
            </motion.div>
          </div>

          {/* bottom: feature bullets */}
          <motion.div variants={fadeUp} className="grid gap-3 sm:grid-cols-1 xl:grid-cols-1">
            {features.map((f) => (
              <div
                key={f.titleKey}
                className="flex items-start gap-3.5 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 backdrop-blur-sm"
              >
                <div
                  className={cn(
                    'grid h-10 w-10 shrink-0 place-items-center rounded-xl',
                    tone(f.tone).soft,
                  )}
                >
                  <f.icon className="h-5 w-5" />
                </div>
                <div className="leading-tight">
                  <p className="text-sm font-semibold text-slate-900">{t(f.titleKey)}</p>
                  <p className="mt-0.5 text-xs leading-snug text-slate-500">{t(f.descKey)}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </aside>

      {/* ======================= RIGHT FORM PANEL ======================= */}
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-12 sm:px-8">
        {/* subtle ambient glow for mobile/right side */}
        <div className="pointer-events-none absolute -top-20 right-0 h-72 w-72 rounded-full bg-grape-500/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 rounded-full bg-ink-500/10 blur-3xl" />
        <div className="absolute inset-0 grain opacity-10 lg:hidden" />

        <motion.div
          variants={scaleIn}
          initial="hidden"
          animate="show"
          className="relative z-10 w-full max-w-md"
        >
          {/* mobile logo */}
          <div className="mb-8 flex justify-center lg:hidden">
            <Logo size="md" />
          </div>

          <GlassCard glow className="p-6 sm:p-8">
            <motion.div
              variants={staggerContainer(0.07, 0.05)}
              initial="hidden"
              animate="show"
              className="space-y-6"
            >
              {/* header */}
              <motion.div variants={fadeUp} className="space-y-2 text-center sm:text-left">
                <Badge tone="ai" dot className="mb-1">
                  {isSignup ? t('auth.badgeSignup') : t('auth.badgeLogin')}
                </Badge>
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                  {isSignup ? t('auth.titleSignup') : t('auth.titleLogin')}
                </h2>
                <p className="text-sm text-slate-500">
                  {isSignup
                    ? t('auth.subtitleSignup')
                    : t('auth.subtitleLogin')}
                </p>
              </motion.div>

              {/* banner thông báo / lỗi */}
              {(error || info) && (
                <motion.div
                  variants={fadeUp}
                  className={cn(
                    'rounded-xl border px-3.5 py-2.5 text-sm',
                    error ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700',
                  )}
                >
                  {error || info}
                </motion.div>
              )}

              {step === 'form' && (
                <>
                  {/* social buttons */}
                  <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3">
                    <Button type="button" variant="glass" className="w-full" onClick={handleGoogle} disabled={submitting}>
                      <GoogleIcon className="h-4 w-4" />
                      Google
                    </Button>
                    <Button type="button" variant="glass" className="w-full" onClick={socialUnavailable}>
                      <AppleIcon className="h-4 w-4" />
                      Apple
                    </Button>
                  </motion.div>

                  {/* divider */}
                  <motion.div variants={fadeUp} className="flex items-center gap-3">
                    <span className="h-px flex-1 bg-slate-200" />
                    <span className="text-xs font-medium uppercase tracking-wider text-slate-400">{t('auth.or')}</span>
                    <span className="h-px flex-1 bg-slate-200" />
                  </motion.div>
                </>
              )}

              {/* form */}
              <motion.form variants={fadeUp} onSubmit={handleSubmit} className="space-y-4">
                {isSignup && step === 'form' && (
                  <div className="space-y-1.5">
                    <label htmlFor="name" className="text-xs font-medium text-slate-600">
                      {t('auth.name')}
                    </label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="name"
                        type="text"
                        autoComplete="name"
                        placeholder={t('auth.namePlaceholder')}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-xs font-medium text-slate-600">
                    {t('auth.email')}
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="ban@cloudmind.vn"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                      readOnly={step !== 'form'}
                    />
                  </div>
                </div>

                {step === 'form' && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="text-xs font-medium text-slate-600">
                      {t('auth.password')}
                    </label>
                    {!isSignup && (
                      <button
                        type="button"
                        onClick={handleForgot}
                        className="text-xs font-medium text-grape-600 transition-colors hover:text-grape-700"
                      >
                        {t('auth.forgot')}
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={isSignup ? 'new-password' : 'current-password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="px-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? t('auth.hidePw') : t('auth.showPw')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700 ring-focus rounded-md"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* password strength (signup only) */}
                  {isSignup && (
                    <motion.div
                      initial={false}
                      animate={{ height: password ? 'auto' : 0, opacity: password ? 1 : 0 }}
                      transition={softSpring}
                      className="overflow-hidden"
                    >
                      <div className="pt-1.5">
                        <div className="flex gap-1.5">
                          {[1, 2, 3, 4].map((seg) => (
                            <div
                              key={seg}
                              className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100"
                            >
                              <motion.div
                                className={cn('h-full rounded-full', strength.bar)}
                                initial={false}
                                animate={{ width: strength.score >= seg ? '100%' : '0%' }}
                                transition={{ ...softSpring, delay: seg * 0.04 }}
                              />
                            </div>
                          ))}
                        </div>
                        {strength.labelKey && (
                          <p className={cn('mt-1.5 text-xs font-medium', strength.toneClass)}>
                            {t('auth.pwStrength')}: {t(strength.labelKey)}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>

                )}

                {/* OTP code (bước xác thực / đặt lại mật khẩu) */}
                {(step === 'otp' || step === 'reset') && (
                  <div className="space-y-1.5">
                    <label htmlFor="code" className="text-xs font-medium text-slate-600">{t('auth.otpLabel')}</label>
                    <div className="relative">
                      <ShieldCheck className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="code"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="••••••"
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                        className="pl-10 tracking-[0.5em]"
                        required
                      />
                    </div>
                    <button type="button" onClick={handleResend} className="text-xs font-medium text-grape-600 hover:text-grape-700">
                      {t('auth.resendCode')}
                    </button>
                  </div>
                )}

                {/* mật khẩu mới (đặt lại) */}
                {step === 'reset' && (
                  <div className="space-y-1.5">
                    <label htmlFor="newPassword" className="text-xs font-medium text-slate-600">{t('auth.newPassword')}</label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input id="newPassword" type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="pl-10" required />
                    </div>
                  </div>
                )}

                {/* remember me (login only) */}
                {!isSignup && step === 'form' && (
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-3">
                      <Toggle checked={remember} onChange={setRemember} />
                      <span className="text-sm text-slate-600">{t('auth.remember')}</span>
                    </div>
                  </div>
                )}

                {/* submit */}
                <Button type="submit" variant="primary" size="lg" className="mt-2 w-full" disabled={submitting}>
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      {t('auth.processing')}
                    </span>
                  ) : (
                    <>
                      {step === 'otp' ? (
                        <>
                          <ShieldCheck className="h-4 w-4" />
                          {t('auth.verifyEmail')}
                        </>
                      ) : step === 'reset' ? (
                        <>
                          <Lock className="h-4 w-4" />
                          {t('auth.resetPasswordBtn')}
                        </>
                      ) : isSignup ? (
                        <>
                          <Sparkles className="h-4 w-4" />
                          {t('auth.createAccount')}
                        </>
                      ) : (
                        <>
                          {t('auth.login')}
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </>
                  )}
                </Button>
              </motion.form>

              {/* mode toggle footer */}
              <motion.div variants={fadeUp} className="text-center text-sm text-slate-500">
                {isSignup ? (
                  <>
                    {t('auth.haveAccount')}{' '}
                    <Link
                      to="/login"
                      className="font-semibold text-gradient transition-opacity hover:opacity-80"
                    >
                      {t('auth.loginNow')}
                    </Link>
                  </>
                ) : (
                  <>
                    {t('auth.noAccount')}{' '}
                    <Link
                      to="/signup"
                      className="font-semibold text-gradient transition-opacity hover:opacity-80"
                    >
                      {t('auth.signupFree')}
                    </Link>
                  </>
                )}
              </motion.div>
            </motion.div>
          </GlassCard>

          {/* tiny trust line */}
          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-6 flex items-center justify-center gap-1.5 text-xs text-slate-400"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            {t('auth.trust')}
          </motion.p>
        </motion.div>
      </main>
    </div>
  )
}