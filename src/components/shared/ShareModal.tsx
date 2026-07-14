import { useEffect, useState } from 'react'
import { Link2, Copy, Check, Trash2, Loader2, Sparkles } from 'lucide-react'
import { Modal, Button } from '@/components/ui'
import { api } from '@/lib/api'
import { useT, type TranslationKey } from '@/lib/i18n'
import { cn } from '@/lib/utils'

interface ShareLink {
  id: string
  token: string
  permission: 'view' | 'edit'
  expiresAt: string | null
  createdAt: string
}

const PERMISSIONS: { id: 'view' | 'edit'; key: TranslationKey }[] = [
  { id: 'view', key: 'ws.accessView' },
  { id: 'edit', key: 'ws.accessEdit' },
]
const EXPIRIES: { days: number; key: TranslationKey }[] = [
  { days: 0, key: 'share.expiryNever' },
  { days: 7, key: 'share.expiry7' },
  { days: 30, key: 'share.expiry30' },
]

function linkFor(token: string) {
  return `${window.location.origin}/share/${token}`
}

/** Hộp thoại quản lý chia sẻ 1 tài liệu: tạo/liệt kê/sao chép/thu hồi liên kết. */
export function ShareModal({ file, onClose }: { file: { id: string; name: string } | null; onClose: () => void }) {
  const t = useT()
  const [shares, setShares] = useState<ShareLink[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [permission, setPermission] = useState<'view' | 'edit'>('view')
  const [expiry, setExpiry] = useState(0)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!file) return
    let active = true
    setLoading(true)
    setError(null)
    api
      .fileShares(file.id)
      .then((res) => {
        if (active) setShares((res as ShareLink[]) ?? [])
      })
      .catch(() => {
        if (active) setShares([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [file])

  async function copy(link: ShareLink) {
    await navigator.clipboard?.writeText(linkFor(link.token)).catch(() => {})
    setCopiedId(link.id)
    window.setTimeout(() => setCopiedId((c) => (c === link.id ? null : c)), 1800)
  }

  async function create() {
    if (!file) return
    setCreating(true)
    setError(null)
    try {
      const res = (await api.shareFile(file.id, {
        permission,
        ...(expiry ? { expiresInDays: expiry } : {}),
      })) as ShareLink & { token: string }
      setShares((s) => [res, ...s])
      await copy(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('share.createFailed'))
    } finally {
      setCreating(false)
    }
  }

  async function revoke(link: ShareLink) {
    if (!file) return
    setShares((s) => s.filter((x) => x.id !== link.id))
    try {
      await api.revokeFileShare(file.id, link.id)
    } catch {
      /* giữ nguyên trạng thái đã xoá lạc quan */
    }
  }

  const isExpired = (l: ShareLink) => !!l.expiresAt && new Date(l.expiresAt).getTime() < Date.now()

  return (
    <Modal open={!!file} onClose={onClose} title={t('share.manageTitle')}>
      <div className="space-y-5">
        <p className="-mt-1 text-sm text-slate-500">{t('share.manageDesc')}</p>
        {file && <p className="truncate text-sm font-semibold text-slate-800">📄 {file.name}</p>}

        {/* Tùy chọn tạo link */}
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <Segmented
            label={t('share.permission')}
            options={PERMISSIONS.map((p) => ({ value: p.id, label: t(p.key) }))}
            value={permission}
            onChange={(v) => setPermission(v as 'view' | 'edit')}
          />
          <Segmented
            label={t('share.expiry')}
            options={EXPIRIES.map((e) => ({ value: String(e.days), label: t(e.key) }))}
            value={String(expiry)}
            onChange={(v) => setExpiry(Number(v))}
          />
          <Button size="md" className="w-full" onClick={create} disabled={creating}>
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {creating ? t('share.creating') : t('share.createLink')}
          </Button>
          {error && <p className="text-sm text-rose-600">{error}</p>}
        </div>

        {/* Danh sách link */}
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            {t('share.activeLinks')} {shares.length > 0 && `(${shares.length})`}
          </p>
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-grape-500" />
            </div>
          ) : shares.length === 0 ? (
            <p className="rounded-xl bg-slate-50 px-3 py-4 text-center text-sm text-slate-400">{t('share.noLinks')}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {shares.map((s) => {
                const expired = isExpired(s)
                return (
                  <div key={s.id} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2.5">
                    <Link2 className={cn('h-4 w-4 shrink-0', expired ? 'text-slate-300' : 'text-grape-500')} />
                    <div className="min-w-0 flex-1">
                      <p className={cn('truncate text-xs font-medium', expired ? 'text-slate-400 line-through' : 'text-slate-700')}>
                        {linkFor(s.token)}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {t(s.permission === 'edit' ? 'ws.accessEdit' : 'ws.accessView')}
                        {' · '}
                        {expired
                          ? t('share.expiredTag')
                          : s.expiresAt
                            ? t('share.expiresOn', { date: new Date(s.expiresAt).toLocaleDateString('vi-VN') })
                            : t('share.neverExpires')}
                      </p>
                    </div>
                    <button
                      type="button"
                      title={t('share.copy')}
                      onClick={() => copy(s)}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                    >
                      {copiedId === s.id ? <Check className="h-4 w-4 text-mint-500" /> : <Copy className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      title={t('share.revoke')}
                      onClick={() => revoke(s)}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

function Segmented({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-0.5">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
              value === o.value ? 'bg-gradient-brand text-white shadow-glow' : 'text-slate-500 hover:text-slate-800',
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}
