import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Bell, Plus, Menu, Command } from 'lucide-react'
import { Avatar, Button, AIChip } from '@/components/ui'
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher'
import { useAuth } from '@/lib/auth'
import { useT } from '@/lib/i18n'
import { api } from '@/lib/api'
import { cn, timeAgo } from '@/lib/utils'

interface NotiItem {
  id: string
  type: string
  title: string
  message?: string
  read: boolean
  createdAt: string
}

function NotificationBell() {
  const t = useT()
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<{ unread: number; items: NotiItem[] }>({ unread: 0, items: [] })
  const ref = useRef<HTMLDivElement>(null)

  const load = () =>
    api
      .notifications()
      .then((res: any) => {
        const items: NotiItem[] = Array.isArray(res) ? res : (res?.items ?? [])
        const unread =
          typeof res?.unread === 'number' ? res.unread : items.filter((n) => !n.read).length
        setData({ unread, items })
      })
      .catch(() => {})
  useEffect(() => { load() }, [])
  useEffect(() => {
    if (!open) return
    load()
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const markAll = async () => {
    try { await api.readAllNotifications() } catch { /* ignore */ }
    load()
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative grid h-11 w-11 place-items-center rounded-2xl text-slate-500 hover:bg-slate-100 ring-focus"
        aria-label={t('topbar.notifications')}
      >
        <Bell className="h-5 w-5" />
        {data.unread > 0 && (
          <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-surface-0">
            {data.unread > 9 ? '9+' : data.unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_16px_40px_-12px_rgba(16,24,40,0.25)]">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-bold text-slate-900">{t('topbar.notifications')}</p>
            {data.unread > 0 && (
              <button onClick={markAll} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                {t('topbar.markAllRead')}
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {(data.items ?? []).length === 0 ? (
              <p className="px-4 py-12 text-center text-sm text-slate-400">{t('topbar.noNotifications')}</p>
            ) : (
              (data.items ?? []).map((n) => (
                <div key={n.id} className={cn('border-b border-slate-50 px-4 py-3', !n.read && 'bg-indigo-50/40')}>
                  <div className="flex items-start gap-2">
                    {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800">{n.title}</p>
                      {n.message && <p className="mt-0.5 text-xs text-slate-500">{n.message}</p>}
                      <p className="mt-1 text-[11px] text-slate-400">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function Topbar({ onMenu, onUpload }: { onMenu?: () => void; onUpload?: () => void }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const t = useT()
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-surface-0/85 px-4 backdrop-blur-xl md:px-6">
      <button onClick={onMenu} className="grid h-10 w-10 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 lg:hidden ring-focus">
        <Menu className="h-5 w-5" />
      </button>

      {/* Search */}
      <button
        onClick={() => navigate('/app/search')}
        className="group flex h-11 min-w-0 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-left text-sm text-slate-400 transition-colors hover:border-slate-300 hover:bg-slate-50 md:max-w-md"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate">{t('topbar.searchPlaceholder')}</span>
        <AIChip className="hidden sm:inline-flex" />
        <kbd className="hidden items-center gap-0.5 rounded-md border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 md:inline-flex">
          <Command className="h-3 w-3" />K
        </kbd>
      </button>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <Button size="sm" onClick={onUpload} className="hidden sm:inline-flex">
          <Plus className="h-4 w-4" />
          {t('topbar.upload')}
        </Button>
        <LanguageSwitcher />
        <NotificationBell />
        <button onClick={() => navigate('/app/settings')} className="ring-focus rounded-full">
          <Avatar initials={user?.initials ?? '··'} tone={user?.tone ?? 'indigo'} size="md" ring />
        </button>
      </div>
    </header>
  )
}
