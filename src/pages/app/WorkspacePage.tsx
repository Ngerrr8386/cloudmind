import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  Crown,
  ShieldCheck,
  Mail,
  Send,
  Trash2,
  LogOut,
  Building2,
  RefreshCw,
  Sofa,
  FolderOpen,
  FolderPlus,
  FileText,
  Activity as ActivityIcon,
  Check,
  Copy,
  Loader2,
  ArrowLeftRight,
  AlertTriangle,
  Sparkles,
  Clock,
  type LucideIcon,
} from 'lucide-react'
import { Button, Badge, GlassCard, Avatar, Input, Modal, ProgressRing } from '@/components/ui'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { useAsync } from '@/lib/useApi'
import { cn, formatBytes, timeAgo } from '@/lib/utils'
import { TONE_ORDER, type Tone } from '@/lib/theme'
import { staggerContainer, fadeUp } from '@/lib/motion'
import { useT, type TranslationKey } from '@/lib/i18n'

/* ------------------------------- types ------------------------------- */

type WsRole = 'owner' | 'wsadmin' | 'member'

interface Workspace {
  id: string
  name: string
  slug?: string
  logoUrl?: string
  owner: string
  seats: number
  status: 'active' | 'suspended'
  createdAt: string
  myRole: WsRole
  memberCount: number
}

interface Member {
  id: string
  wsRole: WsRole
  joinedAt: string
  user: { id: string; name: string; email: string; avatarUrl?: string; storageUsed: number } | null
}

interface Invite {
  id: string
  email: string
  wsRole: WsRole
  status: string
  expiresAt: string
  createdAt: string
}

interface Seats {
  purchased: number
  used: number
  available: number
}

interface Activity {
  id: string
  type: string
  message: string
  createdAt: string
  actor: { id: string; name: string; avatarUrl?: string } | null
}

/* ------------------------------ helpers ------------------------------ */

function initialsOf(name?: string): string {
  return (
    (name ?? '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('') || '?'
  )
}

/** Stable tone from a seed (id/email) so avatar colours stay consistent. */
function toneOf(seed?: string): Tone {
  const s = seed ?? ''
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return TONE_ORDER[h % TONE_ORDER.length]
}

// WsRole values ('owner' | 'wsadmin' | 'member') are LOGIC values (API params). Only the
// display label is translated — reuse the shared role.* keys via this id → key map.
const ROLE_LABEL_KEY: Record<WsRole, TranslationKey> = {
  owner: 'role.owner',
  wsadmin: 'role.wsadmin',
  member: 'role.member',
}

function RoleBadge({ role }: { role: WsRole }) {
  const t = useT()
  if (role === 'owner')
    return (
      <Badge tone="brand">
        <Crown className="h-3 w-3" />
        {t('role.owner')}
      </Badge>
    )
  if (role === 'wsadmin')
    return (
      <Badge tone="sky">
        <ShieldCheck className="h-3 w-3" />
        {t('role.wsadmin')}
      </Badge>
    )
  return <Badge tone="neutral">{t('role.member')}</Badge>
}

function SectionHeading({ title, desc, action }: { title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-slate-900 md:text-xl">{title}</h2>
        {desc && <p className="mt-1 text-sm text-slate-500">{desc}</p>}
      </div>
      {action}
    </div>
  )
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">{children}</label>
}

/* ------------------------------- page -------------------------------- */

export function WorkspacePage() {
  const { data: ws, loading, error, reload } = useAsync(() => api.currentWorkspace() as Promise<Workspace>, [])

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-ink-500" />
      </div>
    )
  }

  if (error || !ws) return <NoWorkspace />

  return <WorkspaceInner ws={ws} reloadWs={reload} />
}

/* -------------------- state: chưa có workspace ----------------------- */

function NoWorkspace() {
  const t = useT()
  const navigate = useNavigate()
  const { user, refreshUser } = useAuth()
  const isTeam = (user?.plan ?? '').toLowerCase().includes('team')
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [err, setErr] = useState<string | null>(null)

  async function handleCreate() {
    setCreating(true)
    setErr(null)
    try {
      await api.createWorkspace({ name: name.trim() || undefined })
      await refreshUser()
      window.location.reload()
    } catch (e) {
      setErr(e instanceof Error ? e.message : t('ws.createError'))
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader
        eyebrow={<Badge tone="brand" dot>{t('ws.collabBadge')}</Badge>}
        title={t('ws.noWsTitle')}
        subtitle={t('ws.noWsSubtitle')}
      />

      <GlassCard className="p-6 md:p-8">
        {isTeam ? (
          <>
            <div className="mb-6 flex items-start gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-brand text-white shadow-glow">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{t('ws.createWsTitle')}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {t('ws.createWsDesc')}
                </p>
              </div>
            </div>
            <FieldLabel>{t('ws.teamName')}</FieldLabel>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('ws.teamNamePlaceholder')}
              maxLength={120}
            />
            {err && <p className="mt-3 text-sm text-rose-600">{err}</p>}
            <div className="mt-5 flex justify-end">
              <Button variant="primary" size="md" disabled={creating} onClick={handleCreate}>
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Building2 className="h-4 w-4" />}
                {creating ? t('ws.creating') : t('ws.createWsBtn')}
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-ink-50">
              <Users className="h-7 w-7 text-ink-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">{t('ws.needTeamTitle')}</h3>
            <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-500">
              {t('ws.needTeamDesc')}
            </p>
            <div className="mt-5 flex justify-center">
              <Button variant="primary" size="md" onClick={() => navigate('/pricing')}>
                <Crown className="h-4 w-4" />
                {t('ws.upgradeToTeam')}
              </Button>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  )
}

/* ---------------------- state: đã có workspace ----------------------- */

type TabId = 'overview' | 'members' | 'invites' | 'seats' | 'shared' | 'activity'

// TabId is a LOGIC value (compared against `tab` state). Only the label is translated.
const TABS: { id: TabId; icon: LucideIcon }[] = [
  { id: 'overview', icon: Building2 },
  { id: 'members', icon: Users },
  { id: 'invites', icon: Mail },
  { id: 'seats', icon: Sofa },
  { id: 'shared', icon: FolderOpen },
  { id: 'activity', icon: ActivityIcon },
]

const TAB_LABEL_KEY: Record<TabId, TranslationKey> = {
  overview: 'nav.overview',
  members: 'ws.members',
  invites: 'ws.tabInvites',
  seats: 'ws.tabSeats',
  shared: 'ws.tabShared',
  activity: 'dashboard.activity',
}

const tabContent = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.18 } },
}

function WorkspaceInner({ ws, reloadWs }: { ws: Workspace; reloadWs: () => void }) {
  const t = useT()
  const [tab, setTab] = useState<TabId>('overview')
  const canManage = ws.myRole === 'owner' || ws.myRole === 'wsadmin'
  const isOwner = ws.myRole === 'owner'

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        eyebrow={<Badge tone="brand" dot>{t('ws.teamSpaceBadge')}</Badge>}
        title={ws.name}
        subtitle={t('ws.headerSubtitle', { count: ws.memberCount, role: t(ROLE_LABEL_KEY[ws.myRole]) })}
      />

      {/* Tab nav */}
      <div className="-mx-1 mb-6 flex gap-2 overflow-x-auto px-1 pb-1 no-scrollbar">
        {TABS.map((item) => {
          const active = item.id === tab
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold ring-focus transition-colors',
                active ? 'bg-gradient-brand text-white shadow-glow' : 'glass text-slate-600 hover:text-slate-900',
              )}
            >
              <item.icon className="h-4 w-4" strokeWidth={2.2} />
              {t(TAB_LABEL_KEY[item.id])}
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} variants={tabContent} initial="hidden" animate="show" exit="exit">
          {tab === 'overview' && <OverviewTab ws={ws} reloadWs={reloadWs} canManage={canManage} isOwner={isOwner} />}
          {tab === 'members' && <MembersTab ws={ws} reloadWs={reloadWs} canManage={canManage} isOwner={isOwner} />}
          {tab === 'invites' && <InvitesTab canManage={canManage} reloadWs={reloadWs} />}
          {tab === 'seats' && <SeatsTab canManage={canManage} reloadWs={reloadWs} />}
          {tab === 'shared' && <SharedTab canManage={canManage} />}
          {tab === 'activity' && <ActivityTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

/* ------------------------------ Overview ----------------------------- */

function OverviewTab({
  ws,
  reloadWs,
  canManage,
  isOwner,
}: {
  ws: Workspace
  reloadWs: () => void
  canManage: boolean
  isOwner: boolean
}) {
  const t = useT()
  const navigate = useNavigate()
  const { refreshUser } = useAuth()
  const { data: seats } = useAsync(() => api.workspaceSeats() as Promise<Seats>, [])
  const { data: invites } = useAsync(() => api.workspaceInvites() as Promise<Invite[]>, [])
  const [name, setName] = useState(ws.name)
  const [slug, setSlug] = useState(ws.slug ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)

  const dirty = name.trim() !== ws.name || (slug.trim() || '') !== (ws.slug ?? '')

  async function handleSave() {
    if (!dirty || !name.trim()) return
    setSaving(true)
    try {
      // Gửi slug rỗng (thay vì undefined) để BE thực sự xoá slug khi người dùng xoá trắng ô.
      await api.updateWorkspace({ name: name.trim(), slug: slug.trim() })
      setSaved(true)
      reloadWs()
      window.setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      window.alert(e instanceof Error ? e.message : t('ws.saveError'))
    } finally {
      setSaving(false)
    }
  }

  async function handleLeave() {
    if (!window.confirm(t('ws.leaveConfirm'))) return
    setBusy(true)
    try {
      await api.leaveWorkspace()
      await refreshUser()
      navigate('/app')
      window.location.reload()
    } catch (e) {
      window.alert(e instanceof Error ? e.message : t('ws.leaveError'))
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm(t('ws.deleteConfirm', { name: ws.name }))) return
    setBusy(true)
    try {
      await api.deleteWorkspace()
      await refreshUser()
      navigate('/app')
      window.location.reload()
    } catch (e) {
      window.alert(e instanceof Error ? e.message : t('ws.deleteError'))
      setBusy(false)
    }
  }

  const stats = [
    { icon: Users, label: t('ws.members'), value: String(ws.memberCount), tone: 'text-ink-600 bg-ink-50' },
    { icon: Sofa, label: t('ws.statSeatsUsed'), value: seats ? `${seats.used}/${seats.purchased}` : '—', tone: 'text-emerald-600 bg-emerald-50' },
    { icon: Mail, label: t('ws.statPendingInvites'), value: invites ? String(invites.length) : '—', tone: 'text-amber-600 bg-amber-50' },
    { icon: Crown, label: t('ws.role'), value: t(ROLE_LABEL_KEY[ws.myRole]), tone: 'text-violet-600 bg-violet-50' },
  ]

  return (
    <div className="space-y-5">
      {/* Stats */}
      <motion.div variants={staggerContainer(0.06)} initial="hidden" animate="show" className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s) => (
          <motion.div key={s.label} variants={fadeUp}>
            <GlassCard className="p-4">
              <div className={cn('mb-2 grid h-9 w-9 place-items-center rounded-xl', s.tone)}>
                <s.icon className="h-4.5 w-4.5" />
              </div>
              <div className="truncate text-base font-bold text-slate-900">{s.value}</div>
              <div className="text-xs text-slate-500">{s.label}</div>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>

      {/* Identity */}
      <GlassCard className="p-6 md:p-7">
        <SectionHeading title={t('ws.identityTitle')} desc={t('ws.identityDesc')} />
        <div className="mb-5 flex items-center gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-brand text-lg font-black text-white shadow-glow">
            {ws.logoUrl ? <img src={ws.logoUrl} alt="" className="h-full w-full object-cover" /> : initialsOf(ws.name)}
          </div>
          <div className="min-w-0">
            <div className="truncate text-base font-bold text-slate-900">{ws.name}</div>
            <div className="text-xs text-slate-400">{t('ws.createdOn', { date: new Date(ws.createdAt).toLocaleDateString('vi-VN') })}</div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel>{t('ws.teamName')}</FieldLabel>
            <Input value={name} onChange={(e) => setName(e.target.value)} disabled={!canManage} maxLength={120} />
          </div>
          <div>
            <FieldLabel>{t('ws.slugLabel')}</FieldLabel>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} disabled={!canManage} placeholder={t('ws.slugPlaceholder')} maxLength={60} />
          </div>
        </div>

        {canManage && (
          <div className="mt-5 flex justify-end">
            <Button variant="primary" size="md" disabled={!dirty || saving || !name.trim()} onClick={handleSave}>
              {saved ? (
                <>
                  <Check className="h-4 w-4" /> {t('ws.saved')}
                </>
              ) : saving ? (
                t('ws.saving')
              ) : (
                t('common.save')
              )}
            </Button>
          </div>
        )}
        {!canManage && (
          <p className="mt-4 text-xs text-slate-400">{t('ws.identityReadonly')}</p>
        )}
      </GlassCard>

      {/* Danger zone */}
      <GlassCard className="border border-rose-500/25 bg-rose-50/30 p-6 md:p-7">
        <SectionHeading title={t('ws.dangerTitle')} desc={t('ws.dangerDesc')} />
        <div className="space-y-3">
          {!isOwner && (
            <div className="flex flex-col gap-3 rounded-2xl bg-white/70 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
                  <LogOut className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800">{t('ws.leaveTitle')}</div>
                  <p className="text-xs text-slate-500">{t('ws.leaveDesc')}</p>
                </div>
              </div>
              <Button variant="danger" size="sm" className="shrink-0" disabled={busy} onClick={handleLeave}>
                <LogOut className="h-4 w-4" /> {t('ws.leaveBtn')}
              </Button>
            </div>
          )}
          {isOwner && (
            <div className="flex flex-col gap-3 rounded-2xl bg-white/70 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-500/15 text-rose-600">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800">{t('ws.deleteTitle')}</div>
                  <p className="text-xs text-slate-500">{t('ws.deleteDesc')}</p>
                </div>
              </div>
              <Button variant="danger" size="sm" className="shrink-0" disabled={busy} onClick={handleDelete}>
                <Trash2 className="h-4 w-4" /> {t('ws.deleteBtn')}
              </Button>
            </div>
          )}
          {isOwner && (
            <p className="text-xs text-slate-500">
              {t('ws.ownerLeaveHint', { tab: t('ws.members') })}
            </p>
          )}
        </div>
      </GlassCard>
    </div>
  )
}

/* ------------------------------ Members ------------------------------ */

function MembersTab({
  ws,
  reloadWs,
  canManage,
  isOwner,
}: {
  ws: Workspace
  reloadWs: () => void
  canManage: boolean
  isOwner: boolean
}) {
  const t = useT()
  const { user } = useAuth()
  const { data: members, loading, reload } = useAsync(() => api.workspaceMembers() as Promise<Member[]>, [])
  const [busyId, setBusyId] = useState<string | null>(null)

  async function withBusy(id: string, fn: () => Promise<unknown>) {
    setBusyId(id)
    try {
      await fn()
      reload()
      reloadWs()
    } catch (e) {
      window.alert(e instanceof Error ? e.message : t('ws.actionFailed'))
    } finally {
      setBusyId(null)
    }
  }

  function changeRole(m: Member, role: 'wsadmin' | 'member') {
    withBusy(m.id, () => api.updateMemberRole(m.id, role))
  }
  function remove(m: Member) {
    if (!window.confirm(t('ws.removeConfirm', { name: m.user?.name ?? t('ws.thisMember') }))) return
    withBusy(m.id, () => api.removeMember(m.id))
  }
  function transfer(m: Member) {
    if (!window.confirm(t('ws.transferConfirm', { name: m.user?.name ?? t('ws.thisMember') }))) return
    withBusy(m.id, async () => {
      await api.transferWorkspace(m.id)
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-3xl border border-slate-200 bg-white p-16 shadow-card">
        <Loader2 className="h-6 w-6 animate-spin text-ink-500" />
      </div>
    )
  }

  const rows = members ?? []

  return (
    <GlassCard className="p-6 md:p-7">
      <SectionHeading title={t('ws.members')} desc={t('ws.membersDesc', { count: rows.length })} />
      <motion.div variants={staggerContainer(0.05)} initial="hidden" animate="show" className="space-y-2">
        {rows.map((m) => {
          const isSelf = m.user?.id === user?.id
          const targetOwner = m.wsRole === 'owner'
          const busy = busyId === m.id
          return (
            <motion.div
              key={m.id}
              variants={fadeUp}
              className="flex flex-wrap items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3"
            >
              <Avatar initials={initialsOf(m.user?.name)} tone={toneOf(m.user?.id ?? m.user?.email)} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold text-slate-800">{m.user?.name ?? t('ws.unknownUser')}</span>
                  {isSelf && <span className="text-[11px] font-semibold text-ink-500">{t('ws.you')}</span>}
                </div>
                <div className="truncate text-xs text-slate-500">{m.user?.email ?? '—'}</div>
              </div>
              <RoleBadge role={m.wsRole} />

              {canManage && !targetOwner && !isSelf && (
                <div className="flex items-center gap-1.5">
                  {m.wsRole === 'member' ? (
                    <Button variant="glass" size="sm" disabled={busy} onClick={() => changeRole(m, 'wsadmin')}>
                      <ShieldCheck className="h-4 w-4" /> {t('ws.promoteAdmin')}
                    </Button>
                  ) : (
                    <Button variant="glass" size="sm" disabled={busy} onClick={() => changeRole(m, 'member')}>
                      {t('ws.demoteMember')}
                    </Button>
                  )}
                  {isOwner && (
                    <Button variant="glass" size="sm" disabled={busy} onClick={() => transfer(m)} title={t('ws.transferOwnership')}>
                      <ArrowLeftRight className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-rose-500 hover:text-rose-600"
                    disabled={busy}
                    onClick={() => remove(m)}
                    title={t('ws.removeFromTeam')}
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </Button>
                </div>
              )}
            </motion.div>
          )
        })}
        {rows.length === 0 && (
          <p className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">{t('ws.noMembers')}</p>
        )}
      </motion.div>
    </GlassCard>
  )
}

/* ------------------------------ Invites ------------------------------ */

function InvitesTab({ canManage, reloadWs }: { canManage: boolean; reloadWs: () => void }) {
  const t = useT()
  const { data: invites, loading, reload } = useAsync(() => api.workspaceInvites() as Promise<Invite[]>, [])
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'wsadmin' | 'member'>('member')
  const [sending, setSending] = useState(false)
  const [msg, setMsg] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null)
  const [lastInvite, setLastInvite] = useState<{ email: string; url: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  if (!canManage) {
    return (
      <GlassCard className="p-6 md:p-7">
        <EmptyState icon={Mail} title={t('ws.invitePermTitle')} description={t('ws.invitePermDesc')} />
      </GlassCard>
    )
  }

  async function send() {
    const value = email.trim().toLowerCase()
    if (!value) return
    setSending(true)
    setMsg(null)
    try {
      const res = (await api.createInvite({ email: value, wsRole: role })) as { inviteUrl?: string }
      setEmail('')
      setMsg({ tone: 'ok', text: t('ws.inviteSent', { email: value }) })
      if (res?.inviteUrl) setLastInvite({ email: value, url: res.inviteUrl })
      reload()
      reloadWs()
    } catch (e) {
      setMsg({ tone: 'err', text: e instanceof Error ? e.message : t('ws.inviteError') })
    } finally {
      setSending(false)
    }
  }

  async function withBusy(id: string, fn: () => Promise<unknown>) {
    setBusyId(id)
    try {
      await fn()
      reload()
      reloadWs()
    } catch (e) {
      window.alert(e instanceof Error ? e.message : t('ws.actionFailed'))
    } finally {
      setBusyId(null)
    }
  }

  const rows = invites ?? []

  return (
    <div className="space-y-5">
      <GlassCard className="p-6 md:p-7">
        <SectionHeading title={t('ws.inviteTitle')} desc={t('ws.inviteDesc')} />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <FieldLabel>{t('auth.email')}</FieldLabel>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('ws.inviteEmailPlaceholder')}
              onKeyDown={(e) => e.key === 'Enter' && send()}
            />
          </div>
          <div className="sm:w-44">
            <FieldLabel>{t('ws.role')}</FieldLabel>
            <div className="relative">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'wsadmin' | 'member')}
                className="h-11 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none ring-focus transition-colors focus:border-ink-400"
              >
                {/* option value = role logic value; only the display label is translated */}
                <option value="member">{t('role.member')}</option>
                <option value="wsadmin">{t('role.wsadmin')}</option>
              </select>
            </div>
          </div>
          <Button variant="primary" size="md" className="shrink-0" disabled={sending || !email.trim()} onClick={send}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {t('ws.sendInvite')}
          </Button>
        </div>
        {msg && (
          <p className={cn('mt-3 text-sm', msg.tone === 'ok' ? 'text-emerald-600' : 'text-rose-600')}>{msg.text}</p>
        )}
        {lastInvite && (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3">
            <p className="text-xs font-semibold text-emerald-700">
              {t('ws.inviteLinkFor', { email: lastInvite.email })}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <input
                readOnly
                value={lastInvite.url}
                onFocus={(e) => e.currentTarget.select()}
                className="min-w-0 flex-1 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs text-slate-600 outline-none"
              />
              <Button
                variant="glass"
                size="sm"
                className="shrink-0"
                onClick={async () => {
                  try {
                    await navigator.clipboard?.writeText(lastInvite.url)
                  } catch {
                    /* trình duyệt chặn clipboard — bỏ qua */
                  }
                  setCopied(true)
                  window.setTimeout(() => setCopied(false), 1800)
                }}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? t('ws.copied') : t('sum.copy')}
              </Button>
            </div>
          </div>
        )}
      </GlassCard>

      <GlassCard className="p-6 md:p-7">
        <SectionHeading title={t('ws.pendingInvitesTitle')} desc={t('ws.pendingInvitesDesc', { count: rows.length })} />
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-ink-500" />
          </div>
        ) : rows.length === 0 ? (
          <p className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">{t('ws.noPendingInvites')}</p>
        ) : (
          <motion.div variants={staggerContainer(0.05)} initial="hidden" animate="show" className="space-y-2">
            {rows.map((iv) => {
              const busy = busyId === iv.id
              const expired = new Date(iv.expiresAt) < new Date()
              return (
                <motion.div key={iv.id} variants={fadeUp} className="flex flex-wrap items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600">
                    <Mail className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-slate-800">{iv.email}</div>
                    <div className="text-xs text-slate-500">
                      {t(ROLE_LABEL_KEY[iv.wsRole])} ·{' '}
                      {expired ? <span className="text-rose-500">{t('ws.expired')}</span> : t('ws.expiresOn', { date: new Date(iv.expiresAt).toLocaleDateString('vi-VN') })}
                    </div>
                  </div>
                  <Button variant="glass" size="sm" disabled={busy} onClick={() => withBusy(iv.id, () => api.resendInvite(iv.id))}>
                    <RefreshCw className="h-4 w-4" /> {t('ws.resend')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-rose-500 hover:text-rose-600"
                    disabled={busy}
                    onClick={() => withBusy(iv.id, () => api.revokeInvite(iv.id))}
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </Button>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </GlassCard>
    </div>
  )
}

/* -------------------------------- Seats ------------------------------ */

function SeatsTab({ canManage, reloadWs }: { canManage: boolean; reloadWs: () => void }) {
  const t = useT()
  const { data: seats, loading, reload } = useAsync(() => api.workspaceSeats() as Promise<Seats>, [])
  const [value, setValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null)

  if (loading || !seats) {
    return (
      <div className="flex items-center justify-center rounded-3xl border border-slate-200 bg-white p-16 shadow-card">
        <Loader2 className="h-6 w-6 animate-spin text-ink-500" />
      </div>
    )
  }

  const pct = seats.purchased > 0 ? Math.round((seats.used / seats.purchased) * 100) : 0

  async function save() {
    const n = Number(value)
    if (!Number.isInteger(n) || n < 1) {
      setMsg({ tone: 'err', text: t('ws.seatsInvalid') })
      return
    }
    setSaving(true)
    setMsg(null)
    try {
      const res = (await api.setWorkspaceSeats(n)) as
        | (Seats & { requiresPayment?: false; previous?: number })
        | { requiresPayment: true; checkoutUrl: string; amount: number; addedSeats: number }
      if (res.requiresPayment) {
        setMsg({
          tone: 'ok',
          text: t('ws.seatsCheckout', { amount: res.amount.toLocaleString('vi-VN'), count: res.addedSeats }),
        })
        window.location.href = res.checkoutUrl
        return
      }
      setValue('')
      setMsg({ tone: 'ok', text: t('ws.seatsUpdated', { count: res.purchased }) })
      reload()
      reloadWs()
    } catch (e) {
      setMsg({ tone: 'err', text: e instanceof Error ? e.message : t('ws.seatsError') })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <GlassCard className="p-6 md:p-7">
        <SectionHeading title={t('ws.seatsTitle')} desc={t('ws.seatsDesc')} />
        <div className="flex flex-col items-center gap-6 md:flex-row md:gap-8">
          <ProgressRing progress={pct} size={140} stroke={12}>
            <div className="text-center">
              <div className="text-2xl font-extrabold text-gradient">
                {seats.used}/{seats.purchased}
              </div>
              <div className="text-[11px] text-slate-500">{t('dashboard.used')}</div>
            </div>
          </ProgressRing>
          <div className="grid flex-1 grid-cols-3 gap-3">
            {[
              { label: t('ws.seatsPurchased'), value: seats.purchased, tone: 'text-ink-600 bg-ink-50' },
              { label: t('ws.seatsUsed'), value: seats.used, tone: 'text-amber-600 bg-amber-50' },
              { label: t('ws.seatsAvailable'), value: seats.available, tone: 'text-emerald-600 bg-emerald-50' },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-slate-50 p-4 text-center">
                <div className={cn('mx-auto mb-2 grid h-9 w-9 place-items-center rounded-xl text-sm font-bold', s.tone)}>
                  {s.value}
                </div>
                <div className="text-xs text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-6 md:p-7">
        {canManage ? (
          <>
            <SectionHeading title={t('ws.adjustSeatsTitle')} desc={t('ws.adjustSeatsDesc')} />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <FieldLabel>{t('ws.newSeatCount')}</FieldLabel>
                <Input
                  type="number"
                  min={1}
                  max={500}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={t('ws.currentSeats', { count: seats.purchased })}
                />
              </div>
              <Button variant="primary" size="md" className="shrink-0" disabled={saving || !value} onClick={save}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sofa className="h-4 w-4" />}
                {t('ws.updateSeats')}
              </Button>
            </div>
            {msg && <p className={cn('mt-3 text-sm', msg.tone === 'ok' ? 'text-emerald-600' : 'text-rose-600')}>{msg.text}</p>}
          </>
        ) : (
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 shrink-0 text-ink-500" />
            <p className="text-sm text-slate-600">{t('ws.seatsOwnerOnly')}</p>
          </div>
        )}
      </GlassCard>
    </div>
  )
}

/* ------------------------------- Shared ------------------------------ */

interface SharedFolder {
  id: string
  name: string
  permissions?: { user: string; access: 'view' | 'edit' }[]
}
interface SharedFile {
  id: string
  name: string
  size?: number
  updatedAt?: string
}

function SharedTab({ canManage }: { canManage: boolean }) {
  const t = useT()
  const { data, loading, reload } = useAsync(
    () => api.workspaceShared() as Promise<{ folders: SharedFolder[]; files: SharedFile[] }>,
    [],
  )
  const { data: members } = useAsync(() => api.workspaceMembers() as Promise<Member[]>, [])
  const [editing, setEditing] = useState<SharedFolder | null>(null)
  const [adding, setAdding] = useState(false)
  const [detachingId, setDetachingId] = useState<string | null>(null)

  async function detach(f: SharedFolder) {
    if (!window.confirm(t('ws.detachConfirm', { name: f.name }))) return
    setDetachingId(f.id)
    try {
      await api.detachFolderFromWorkspace(f.id)
      reload()
    } catch (e) {
      window.alert(e instanceof Error ? e.message : t('ws.detachError'))
    } finally {
      setDetachingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-3xl border border-slate-200 bg-white p-16 shadow-card">
        <Loader2 className="h-6 w-6 animate-spin text-ink-500" />
      </div>
    )
  }

  const folders = data?.folders ?? []
  const files = data?.files ?? []

  return (
    <div className="space-y-5">
      <GlassCard className="p-6 md:p-7">
        <SectionHeading
          title={t('ws.sharedFoldersTitle')}
          desc={t('ws.sharedFoldersDesc')}
          action={
            canManage ? (
              <Button variant="primary" size="sm" onClick={() => setAdding(true)}>
                <FolderPlus className="h-4 w-4" /> {t('ws.addFolder')}
              </Button>
            ) : undefined
          }
        />
        {folders.length === 0 ? (
          <p className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">
            {canManage ? t('ws.noSharedFoldersManage') : t('ws.noSharedFolders')}
          </p>
        ) : (
          <motion.div variants={staggerContainer(0.05)} initial="hidden" animate="show" className="space-y-2">
            {folders.map((f) => (
              <motion.div key={f.id} variants={fadeUp} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-ink-50 text-ink-600">
                  <FolderOpen className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-slate-800">{f.name}</div>
                  <div className="text-xs text-slate-500">{t('ws.permCount', { count: f.permissions?.length ?? 0 })}</div>
                </div>
                {canManage && (
                  <div className="flex items-center gap-1.5">
                    <Button variant="glass" size="sm" onClick={() => setEditing(f)}>
                      <ShieldCheck className="h-4 w-4" /> {t('ws.permissions')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-rose-500 hover:text-rose-600"
                      disabled={detachingId === f.id}
                      onClick={() => detach(f)}
                      title={t('ws.removeFromTeam')}
                    >
                      {detachingId === f.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </GlassCard>

      <GlassCard className="p-6 md:p-7">
        <SectionHeading title={t('ws.sharedFilesTitle')} desc={t('ws.sharedFilesDesc', { count: files.length })} />
        {files.length === 0 ? (
          <p className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">{t('ws.noSharedFiles')}</p>
        ) : (
          <motion.div variants={staggerContainer(0.04)} initial="hidden" animate="show" className="space-y-2">
            {files.map((f) => (
              <motion.div key={f.id} variants={fadeUp} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
                  <FileText className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-slate-800">{f.name}</div>
                  <div className="text-xs text-slate-500">
                    {typeof f.size === 'number' ? formatBytes(f.size) : '—'}
                    {f.updatedAt ? ` · ${timeAgo(f.updatedAt)}` : ''}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </GlassCard>

      <PermissionsModal
        folder={editing}
        members={members ?? []}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null)
          reload()
        }}
      />

      <AddFolderModal
        open={adding}
        onClose={() => setAdding(false)}
        onAdded={() => {
          setAdding(false)
          reload()
        }}
      />
    </div>
  )
}

interface PersonalFolder {
  id: string
  name: string
  parentId: string | null
  workspaceId: string | null
  fileCount: number
}

function AddFolderModal({ open, onClose, onAdded }: { open: boolean; onClose: () => void; onAdded: () => void }) {
  const t = useT()
  // Chỉ tải danh sách khi modal mở; đóng lại trả mảng rỗng để tránh gọi thừa.
  const { data: folders, loading } = useAsync(
    () => (open ? (api.folders() as Promise<PersonalFolder[]>) : Promise.resolve<PersonalFolder[]>([])),
    [open],
  )
  const [busyId, setBusyId] = useState<string | null>(null)
  // Chỉ cho chọn thư mục gốc cá nhân (chưa thuộc nhóm nào).
  const candidates = (folders ?? []).filter((f) => !f.workspaceId && !f.parentId)

  async function add(f: PersonalFolder) {
    setBusyId(f.id)
    try {
      await api.attachFolderToWorkspace(f.id)
      onAdded()
    } catch (e) {
      window.alert(e instanceof Error ? e.message : t('ws.addFolderError'))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={t('ws.addFolderModalTitle')}>
      <p className="mb-4 text-sm text-slate-500">
        {t('ws.addFolderModalDesc')}
      </p>
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-ink-500" />
        </div>
      ) : candidates.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">
          {t('ws.noCandidateFolders')}
        </p>
      ) : (
        <div className="max-h-80 space-y-2 overflow-y-auto">
          {candidates.map((f) => (
            <div key={f.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-2.5">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-ink-50 text-ink-600">
                <FolderOpen className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-slate-800">{f.name}</div>
                <div className="text-xs text-slate-500">{t('ins.fileCount', { n: f.fileCount })}</div>
              </div>
              <Button variant="primary" size="sm" disabled={busyId === f.id} onClick={() => add(f)}>
                {busyId === f.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderPlus className="h-4 w-4" />} {t('ws.add')}
              </Button>
            </div>
          ))}
        </div>
      )}
      <div className="mt-5 flex justify-end">
        <Button variant="ghost" size="md" onClick={onClose}>
          {t('upload.close')}
        </Button>
      </div>
    </Modal>
  )
}

function PermissionsModal({
  folder,
  members,
  onClose,
  onSaved,
}: {
  folder: SharedFolder | null
  members: Member[]
  onClose: () => void
  onSaved: () => void
}) {
  const t = useT()
  const initial = useMemo(() => {
    const map: Record<string, 'none' | 'view' | 'edit'> = {}
    for (const p of folder?.permissions ?? []) map[p.user] = p.access
    return map
  }, [folder])
  const [access, setAccess] = useState<Record<string, 'none' | 'view' | 'edit'>>({})
  const [saving, setSaving] = useState(false)
  // Re-seed local state whenever a different folder opens.
  const [seededFor, setSeededFor] = useState<string | null>(null)
  if (folder && seededFor !== folder.id) {
    setSeededFor(folder.id)
    setAccess(initial)
  }

  async function save() {
    if (!folder) return
    setSaving(true)
    try {
      const permissions = members
        .filter((m) => m.user && (access[m.user.id] === 'view' || access[m.user.id] === 'edit'))
        .map((m) => ({ user: m.user!.id, access: access[m.user!.id] as 'view' | 'edit' }))
      await api.setFolderPermissions(folder.id, permissions)
      onSaved()
    } catch (e) {
      window.alert(e instanceof Error ? e.message : t('ws.permSaveError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={!!folder} onClose={onClose} title={folder ? t('ws.permModalTitle', { name: folder.name }) : ''}>
      <p className="mb-4 text-sm text-slate-500">{t('ws.permModalDesc')}</p>
      <div className="max-h-80 space-y-2 overflow-y-auto">
        {members.filter((m) => m.user).map((m) => {
          const uid = m.user!.id
          const val = access[uid] ?? 'none'
          return (
            <div key={m.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-2.5">
              <Avatar initials={initialsOf(m.user?.name)} tone={toneOf(uid)} size="xs" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-slate-800">{m.user?.name}</div>
                <div className="truncate text-xs text-slate-400">{m.user?.email}</div>
              </div>
              <div className="flex items-center gap-1 rounded-full bg-white p-1">
                {/* opt ('none'|'view'|'edit') is the logic access value; only the label is translated */}
                {(['none', 'view', 'edit'] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setAccess((a) => ({ ...a, [uid]: opt }))}
                    className={cn(
                      'rounded-full px-2.5 py-1 text-xs font-semibold transition-colors',
                      val === opt ? 'bg-gradient-brand text-white shadow-glow' : 'text-slate-500 hover:text-slate-800',
                    )}
                  >
                    {opt === 'none' ? t('ws.accessNone') : opt === 'view' ? t('ws.accessView') : t('ws.accessEdit')}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
        {members.filter((m) => m.user).length === 0 && (
          <p className="py-6 text-center text-sm text-slate-400">{t('ws.noMembersToPermit')}</p>
        )}
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" size="md" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button variant="primary" size="md" disabled={saving} onClick={save}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {t('ws.savePermissions')}
        </Button>
      </div>
    </Modal>
  )
}

/* ------------------------------ Activity ----------------------------- */

function ActivityTab() {
  const t = useT()
  const { data: acts, loading } = useAsync(() => api.workspaceActivity() as Promise<Activity[]>, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-3xl border border-slate-200 bg-white p-16 shadow-card">
        <Loader2 className="h-6 w-6 animate-spin text-ink-500" />
      </div>
    )
  }

  const rows = acts ?? []

  return (
    <GlassCard className="p-6 md:p-7">
      <SectionHeading title={t('ws.activityLogTitle')} desc={t('ws.activityLogDesc')} />
      {rows.length === 0 ? (
        <p className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">{t('ws.noActivity')}</p>
      ) : (
        <motion.div variants={staggerContainer(0.04)} initial="hidden" animate="show" className="space-y-1">
          {rows.map((a) => (
            <motion.div key={a.id} variants={fadeUp} className="flex items-start gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-slate-50">
              <Avatar initials={initialsOf(a.actor?.name)} tone={toneOf(a.actor?.id ?? a.type)} size="xs" className="mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="text-sm text-slate-700">
                  <span className="font-semibold text-slate-900">{a.actor?.name ?? t('ws.systemActor')}</span> {a.message}
                </div>
                <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
                  <Clock className="h-3 w-3" />
                  {timeAgo(a.createdAt)}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </GlassCard>
  )
}
