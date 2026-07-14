import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Users, Crown, ShieldCheck, Check, X, Loader2, LogIn, AlertTriangle } from 'lucide-react'
import { Logo, Button, Badge, GlassCard, AnimatedBackground } from '@/components/ui'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import { useAsync } from '@/lib/useApi'
import { useT, type TranslationKey } from '@/lib/i18n'
import { cn } from '@/lib/utils'

interface InviteInfo {
  email: string
  wsRole: 'owner' | 'wsadmin' | 'member'
  status: 'pending' | 'accepted' | 'declined' | 'revoked'
  expired: boolean
  workspace: { id: string; name: string } | null
  invitedBy: string | null
}

const ROLE_LABEL: Record<string, TranslationKey> = { owner: 'role.owner', wsadmin: 'role.wsadmin', member: 'role.member' }

/** Trang chấp nhận lời mời vào không gian nhóm — /invite/:token */
export function InvitePage() {
  const { token = '' } = useParams()
  const navigate = useNavigate()
  const { user, loading: authLoading, logout } = useAuth()
  const t = useT()
  const { data: invite, loading, error } = useAsync(() => api.invite(token) as Promise<InviteInfo>, [token])

  const [working, setWorking] = useState<'accept' | 'decline' | null>(null)
  const [done, setDone] = useState<'accepted' | 'declined' | null>(null)
  const [errMsg, setErrMsg] = useState<string | null>(null)

  // Đổi tài khoản: đăng xuất trước rồi mới về trang đăng nhập, để không bị chặn bởi
  // guard "đã đăng nhập" và quay lại đúng trang lời mời sau khi đăng nhập lại.
  async function switchAccount() {
    await logout()
    navigate('/login', { state: { from: { pathname: `/invite/${token}` } } })
  }

  async function accept() {
    setWorking('accept')
    setErrMsg(null)
    try {
      await api.acceptInvite(token)
      setDone('accepted')
      window.setTimeout(() => navigate('/app/workspace'), 900)
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : t('invite.acceptFailed'))
      setWorking(null)
    }
  }

  async function decline() {
    setWorking('decline')
    setErrMsg(null)
    try {
      await api.declineInvite(token)
      setDone('declined')
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : t('invite.declineFailed'))
      setWorking(null)
    }
  }

  const busy = loading || authLoading
  const invalid = !busy && (!!error || !invite || invite.status !== 'pending' || invite.expired)
  const emailMismatch = !!user && !!invite && user.email.toLowerCase() !== invite.email.toLowerCase()

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-surface-0 px-4 py-10">
      <AnimatedBackground variant="subtle" className="opacity-60" />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Link to="/">
            <Logo />
          </Link>
        </div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <GlassCard className="p-6 md:p-8">
            {busy ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <Loader2 className="h-7 w-7 animate-spin text-ink-500" />
                <p className="text-sm text-slate-500">{t('invite.loading')}</p>
              </div>
            ) : done === 'accepted' ? (
              <Result
                tone="ok"
                icon={Check}
                title={t('invite.acceptedTitle')}
                desc={t('invite.acceptedDesc', { workspace: invite?.workspace?.name ?? t('invite.workspaceFallback') })}
              />
            ) : done === 'declined' ? (
              <Result
                tone="neutral"
                icon={X}
                title={t('invite.declinedTitle')}
                desc={t('invite.declinedDesc')}
                action={
                  <Button variant="glass" size="md" onClick={() => navigate('/')}>
                    {t('common.backHome')}
                  </Button>
                }
              />
            ) : invalid ? (
              <Result
                tone="err"
                icon={AlertTriangle}
                title={t('invite.invalidTitle')}
                desc={
                  invite?.expired
                    ? t('invite.expired')
                    : invite && invite.status !== 'pending'
                      ? t('invite.processed')
                      : t('invite.notFound')
                }
                action={
                  <Button variant="glass" size="md" onClick={() => navigate('/')}>
                    {t('common.backHome')}
                  </Button>
                }
              />
            ) : (
              <>
                <div className="mb-5 text-center">
                  <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-brand text-white shadow-glow">
                    <Users className="h-7 w-7" />
                  </div>
                  <p className="text-sm text-slate-500">
                    {invite?.invitedBy ? <span className="font-semibold text-slate-700">{invite.invitedBy}</span> : t('invite.someone')} {t('invite.invitedYou')}
                  </p>
                  <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">
                    {invite?.workspace?.name ?? t('invite.workspaceFallback')}
                  </h1>
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <Badge tone={invite?.wsRole === 'wsadmin' ? 'sky' : 'neutral'}>
                      {invite?.wsRole === 'wsadmin' ? <ShieldCheck className="h-3 w-3" /> : <Crown className="h-3 w-3" />}
                      {t(ROLE_LABEL[invite?.wsRole ?? 'member'])}
                    </Badge>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-slate-400">{invite?.email}</span>
                  </div>
                </div>

                {!user ? (
                  <div className="space-y-3">
                    <p className="rounded-2xl bg-slate-50 px-4 py-3 text-center text-sm text-slate-500">
                      {t('invite.loginPromptPre')} <span className="font-semibold text-slate-700">{invite?.email}</span> {t('invite.loginPromptPost')}
                    </p>
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full"
                      onClick={() => navigate('/login', { state: { from: { pathname: `/invite/${token}` } } })}
                    >
                      <LogIn className="h-4 w-4" /> {t('invite.loginToJoin')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="md"
                      className="w-full"
                      onClick={() => navigate('/signup', { state: { from: { pathname: `/invite/${token}` } } })}
                    >
                      {t('invite.noAccountSignup')}
                    </Button>
                  </div>
                ) : emailMismatch ? (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>
                        {t('invite.mismatchPre')} <span className="font-semibold">{invite?.email}</span>{t('invite.mismatchMid')}{' '}
                        <span className="font-semibold">{user.email}</span>{t('invite.mismatchPost')}
                      </span>
                    </div>
                    <Button variant="glass" size="md" className="w-full" onClick={switchAccount}>
                      {t('invite.switchAccount')}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {errMsg && <p className="text-center text-sm text-rose-600">{errMsg}</p>}
                    <Button variant="primary" size="lg" className="w-full" disabled={!!working} onClick={accept}>
                      {working === 'accept' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      {t('invite.accept')}
                    </Button>
                    <Button variant="ghost" size="md" className="w-full text-slate-500" disabled={!!working} onClick={decline}>
                      {working === 'decline' ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                      {t('invite.decline')}
                    </Button>
                  </div>
                )}
              </>
            )}
          </GlassCard>
        </motion.div>
      </div>
    </div>
  )
}

function Result({
  tone,
  icon: Icon,
  title,
  desc,
  action,
}: {
  tone: 'ok' | 'err' | 'neutral'
  icon: typeof Check
  title: string
  desc: string
  action?: React.ReactNode
}) {
  const toneCls = {
    ok: 'bg-emerald-500 text-white',
    err: 'bg-rose-500/15 text-rose-600',
    neutral: 'bg-slate-100 text-slate-600',
  }[tone]
  return (
    <div className="flex flex-col items-center py-4 text-center">
      <div className={cn('mb-4 grid h-16 w-16 place-items-center rounded-2xl', toneCls)}>
        <Icon className="h-7 w-7" />
      </div>
      <h1 className="text-xl font-bold text-slate-900">{title}</h1>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-slate-500">{desc}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
