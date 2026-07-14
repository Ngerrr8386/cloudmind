import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, FolderOpen, Search, MessageSquareText, Sparkles,
  Network, Crown, HardDrive, Users,
} from 'lucide-react'
import { Logo, ProgressBar } from '@/components/ui'
import { useAuth } from '@/lib/auth'
import { useT, type TranslationKey } from '@/lib/i18n'
import { formatBytes, cn } from '@/lib/utils'

const nav: { to: string; labelKey: TranslationKey; icon: typeof LayoutDashboard; end?: boolean; ai?: boolean }[] = [
  { to: '/app', labelKey: 'nav.overview', icon: LayoutDashboard, end: true },
  { to: '/app/files', labelKey: 'nav.files', icon: FolderOpen },
  { to: '/app/search', labelKey: 'nav.search', icon: Search, ai: true },
  { to: '/app/chat', labelKey: 'nav.chat', icon: MessageSquareText, ai: true },
  { to: '/app/summaries', labelKey: 'nav.summaries', icon: Sparkles, ai: true },
  { to: '/app/insights', labelKey: 'nav.insights', icon: Network, ai: true },
  { to: '/app/workspace', labelKey: 'nav.workspace', icon: Users },
]

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth()
  const t = useT()
  const storageUsed = user?.storageUsed ?? 0
  const storageTotal = user?.storageTotal ?? 1
  const pct = (storageUsed / storageTotal) * 100
  return (
    <aside className="flex h-full w-[260px] flex-col gap-6 border-r border-slate-200 bg-white px-4 py-5">
      <div className="px-2">
        <Logo />
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        <p className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">{t('nav.section')}</p>
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-colors',
                isActive ? 'text-ink-700' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-2xl bg-ink-50 border border-ink-200"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <item.icon className={cn('relative h-[18px] w-[18px] shrink-0', isActive && 'text-ink-600')} />
                <span className="relative">{t(item.labelKey)}</span>
                {item.ai && <Sparkles className="relative ml-auto h-3 w-3 text-ink-400" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Storage card */}
      <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-500">
          <HardDrive className="h-4 w-4" />
          {t('sidebar.storage')}
        </div>
        <ProgressBar progress={pct} className="mb-2" />
        <p className="text-xs text-slate-400">
          <span className="font-bold text-slate-700">{formatBytes(storageUsed, 0)}</span> / {formatBytes(storageTotal, 0)}
        </p>
      </div>

      {/* Upgrade CTA */}
      <NavLink
        to="/pricing"
        onClick={onNavigate}
        className="group flex items-center gap-3 rounded-2xl bg-gradient-brand p-3.5 shadow-glow transition-transform hover:scale-[1.02]"
      >
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/20">
          <Crown className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-white">{t('sidebar.upgradeTitle')}</p>
          <p className="text-[11px] text-white/80">{t('sidebar.upgradeDesc')}</p>
        </div>
      </NavLink>
    </aside>
  )
}
