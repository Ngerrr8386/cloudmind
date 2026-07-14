import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Download, Loader2, AlertTriangle, Eye, Clock, ArrowRight } from 'lucide-react'
import {
  Logo,
  Button,
  Badge,
  GlassCard,
  AnimatedBackground,
  FileTypeIcon,
  fileTint,
  useFileTypeLabel,
} from '@/components/ui'
import { api } from '@/lib/api'
import { useAsync } from '@/lib/useApi'
import { useT, useI18n } from '@/lib/i18n'
import { cn, formatBytes } from '@/lib/utils'
import { tone } from '@/lib/theme'
import type { FileType } from '@/lib/types'

interface SharedFile {
  name: string
  type: FileType
  size: number
  permission: 'view' | 'edit'
  sharedBy: string
  sharedAt: string
  expiresAt: string | null
  canDownload: boolean
}

/** Trang xem tài liệu qua liên kết chia sẻ công khai — /share/:token */
export function ShareViewPage() {
  const { token = '' } = useParams()
  const t = useT()
  const { lang } = useI18n()
  const fileLabel = useFileTypeLabel()
  const { data: file, loading, error } = useAsync(() => api.getShare(token) as Promise<SharedFile>, [token])

  const [downloading, setDownloading] = useState(false)
  const [dlError, setDlError] = useState<string | null>(null)

  async function download() {
    setDownloading(true)
    setDlError(null)
    try {
      const res = (await api.shareDownloadUrl(token)) as { url: string }
      if (res.url) window.open(res.url, '_blank', 'noopener')
    } catch {
      setDlError(t('share.downloadFailed'))
    } finally {
      setDownloading(false)
    }
  }

  const dateStr = (iso: string) =>
    new Date(iso).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-surface-0 px-4 py-10">
      <AnimatedBackground variant="subtle" className="opacity-60" />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Link to="/">
            <Logo />
          </Link>
        </div>

        {loading ? (
          <GlassCard className="flex items-center justify-center gap-3 p-10 text-sm text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin text-grape-500" />
            {t('share.loading')}
          </GlassCard>
        ) : error || !file ? (
          <GlassCard className="p-8 text-center">
            <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-rose-50 text-rose-500">
              <AlertTriangle className="h-7 w-7" />
            </span>
            <h1 className="text-lg font-bold text-slate-900">{t('share.invalidTitle')}</h1>
            <p className="mx-auto mt-2 max-w-xs text-sm text-slate-500">
              {error ?? t('share.invalidTitle')}
            </p>
            <Link to="/" className="mt-6 inline-block">
              <Button variant="secondary" size="md">
                {t('common.backHome')}
              </Button>
            </Link>
          </GlassCard>
        ) : (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <GlassCard glow className="p-7 text-center">
              <Badge tone="ai" dot className="mb-5">
                {t('share.title')}
              </Badge>

              <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-3xl shadow-card">
                <div className={cn('grid h-full w-full place-items-center rounded-3xl', tone(undefined).soft)}>
                  <FileTypeIcon type={file.type} className={cn('h-10 w-10', fileTint(file.type))} />
                </div>
              </div>

              <h1 className="break-words px-2 text-lg font-bold text-slate-900">{file.name}</h1>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-slate-400">
                <span className="font-semibold text-slate-500">{fileLabel(file.type)}</span>
                <span className="h-1 w-1 rounded-full bg-slate-300" />
                <span className="tabular-nums">{formatBytes(file.size)}</span>
                <span className="h-1 w-1 rounded-full bg-slate-300" />
                <span className="inline-flex items-center gap-1">
                  <Eye className="h-3 w-3" /> {t('share.viewOnly')}
                </span>
              </div>

              <p className="mt-4 text-sm text-slate-600">{t('share.sharedBy', { name: file.sharedBy })}</p>
              {file.expiresAt && (
                <p className="mt-1 inline-flex items-center gap-1 text-xs text-amber-600">
                  <Clock className="h-3 w-3" /> {t('share.expiresOn', { date: dateStr(file.expiresAt) })}
                </p>
              )}

              {file.canDownload && (
                <Button
                  size="lg"
                  className="mt-6 w-full"
                  onClick={download}
                  disabled={downloading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  {downloading ? t('share.downloading') : t('file.download')}
                </Button>
              )}
              {dlError && <p className="mt-2 text-sm text-rose-600">{dlError}</p>}
            </GlassCard>

            <Link to="/" className="mt-4 flex items-center justify-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-grape-600">
              {t('share.openApp')}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="mt-3 text-center text-xs text-slate-400">{t('share.poweredBy')}</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
