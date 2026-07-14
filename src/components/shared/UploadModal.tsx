import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UploadCloud, FileText, Sparkles, Check, FolderInput, Wand2, AlertTriangle } from 'lucide-react'
import { Modal, Button, FolderGlyph, ConfidenceMeter } from '@/components/ui'
import { tone as toneClasses } from '@/lib/theme'
import { cn, formatBytes } from '@/lib/utils'
import { api } from '@/lib/api'
import { useAsync } from '@/lib/useApi'
import { useT, type TranslationKey } from '@/lib/i18n'
import type { Folder, FolderSuggestion } from '@/lib/types'

type Stage = 'drop' | 'analyzing' | 'suggest' | 'uploading' | 'done' | 'error'

const analyzingStepKeys: TranslationKey[] = ['upload.step1', 'upload.step2', 'upload.step3', 'upload.step4']

export function UploadModal({ open, onClose, onUploaded }: { open: boolean; onClose: () => void; onUploaded?: () => void }) {
  const t = useT()
  const [stage, setStage] = useState<Stage>('drop')
  const [step, setStep] = useState(0)
  const [picked, setPicked] = useState<string>('')
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [uploaded, setUploaded] = useState(0)
  const [failed, setFailed] = useState(0)
  const [manual, setManual] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Thư mục thật từ backend — refetch mỗi khi mở modal để không dùng danh sách cũ
  // (folder vừa tạo trong phiên vẫn hiện ra ở chế độ "Chọn thủ công").
  const { data: foldersData } = useAsync(() => api.folders() as Promise<Folder[]>, [open])
  const folders = useMemo<Folder[]>(() => foldersData ?? [], [foldersData])

  // Gợi ý nơi lưu: lấy các thư mục nhiều file nhất làm ứng viên.
  const folderSuggestions = useMemo<FolderSuggestion[]>(() => {
    const top = [...folders].sort((a, b) => b.fileCount - a.fileCount).slice(0, 3)
    return top.map((f, i) => ({
      folderId: f.id,
      folderName: f.name,
      confidence: Math.max(0.3, 0.95 - i * 0.18),
      reason:
        i === 0
          ? t('upload.reasonTop')
          : t('upload.reasonOther'),
    }))
  }, [folders, t])

  // Đặt lựa chọn mặc định khi có gợi ý.
  useEffect(() => {
    if (!picked && folderSuggestions[0]) setPicked(folderSuggestions[0].folderId)
  }, [folderSuggestions, picked])

  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setStage('drop')
        setStep(0)
        setPendingFiles([])
        setUploaded(0)
        setFailed(0)
        setManual(false)
        setPicked(folderSuggestions[0]?.folderId ?? '')
      }, 300)
      return () => clearTimeout(t)
    }
  }, [open, folderSuggestions])

  useEffect(() => {
    if (stage !== 'analyzing') return
    if (step < analyzingStepKeys.length) {
      const t = setTimeout(() => setStep((s) => s + 1), 650)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setStage('suggest'), 400)
    return () => clearTimeout(t)
  }, [stage, step])

  const onPick = (list: FileList | null) => {
    const arr = list ? Array.from(list) : []
    if (arr.length === 0) return
    setPendingFiles(arr)
  }

  const startUpload = () => {
    if (pendingFiles.length === 0) return
    setStage('analyzing')
    setStep(0)
  }

  // Tải từng file lên backend rồi đóng modal.
  const confirmUpload = async () => {
    setStage('uploading')
    setUploaded(0)
    setFailed(0)
    let failedCount = 0
    let okCount = 0
    for (const file of pendingFiles) {
      try {
        await api.uploadFile(file, picked || undefined)
        okCount += 1
      } catch {
        failedCount += 1
      }
      setUploaded((n) => n + 1)
    }
    setFailed(failedCount)
    if (okCount === 0) {
      // Tất cả đều lỗi → KHÔNG báo thành công.
      setStage('error')
      return
    }
    setStage('done')
    onUploaded?.()
  }

  const firstFile = pendingFiles[0]

  return (
    <Modal open={open} onClose={onClose} className="max-w-xl">
      <div className="mb-5 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-brand shadow-glow">
          <UploadCloud className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">{t('upload.title')}</h3>
          <p className="text-sm text-slate-500">{t('upload.subtitle')}</p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => onPick(e.target.files)}
      />

      <AnimatePresence mode="wait">
        {/* DROP */}
        {stage === 'drop' && (
          <motion.div key="drop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -10 }}>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                onPick(e.dataTransfer.files)
              }}
              className="group relative grid w-full place-items-center rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center transition-colors hover:border-ink-400 hover:bg-ink-50/50"
            >
              <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2.4, repeat: Infinity }} className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-white shadow-soft">
                <UploadCloud className="h-8 w-8 text-ink-500" />
              </motion.div>
              <p className="font-semibold text-slate-800">{t('upload.drop')}</p>
              <p className="mt-1 text-sm text-slate-400">{t('upload.dropHint')}</p>
            </button>
            {firstFile && (
              <div className="mt-4 flex items-center gap-3 rounded-2xl bg-slate-50 border border-slate-200 p-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-rose-50">
                  <FileText className="h-5 w-5 text-rose-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {firstFile.name}
                    {pendingFiles.length > 1 && ` ${t('upload.moreFiles', { count: pendingFiles.length - 1 })}`}
                  </p>
                  <p className="text-xs text-slate-400">{t('upload.ready', { size: formatBytes(firstFile.size) })}</p>
                </div>
                <Check className="h-5 w-5 text-emerald-500" />
              </div>
            )}
            <Button onClick={startUpload} disabled={pendingFiles.length === 0} className="mt-5 w-full">
              <Sparkles className="h-4 w-4" />
              {t('upload.analyzeBtn')}
            </Button>
          </motion.div>
        )}

        {/* ANALYZING */}
        {stage === 'analyzing' && (
          <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-6">
            <div className="mb-6 grid place-items-center">
              <div className="relative grid h-24 w-24 place-items-center">
                <span className="absolute inset-0 rounded-full bg-ink-200/60 animate-pulse-ring" />
                <span className="absolute inset-0 rounded-full bg-grape-200/50 animate-pulse-ring" style={{ animationDelay: '0.8s' }} />
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-brand shadow-glow">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
                    <Wand2 className="h-7 w-7 text-white" />
                  </motion.div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {analyzingStepKeys.map((key, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0.4 }}
                  animate={{ opacity: i <= step ? 1 : 0.4 }}
                  className="flex items-center gap-3 text-sm"
                >
                  <span className={cn('grid h-5 w-5 place-items-center rounded-full text-[10px] text-white', i < step ? 'bg-emerald-500' : i === step ? 'bg-ink-600' : 'bg-slate-300')}>
                    {i < step ? <Check className="h-3 w-3" /> : i + 1}
                  </span>
                  <span className={i <= step ? 'text-slate-700' : 'text-slate-400'}>{t(key)}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* SUGGEST */}
        {stage === 'suggest' && (
          <motion.div key="suggest" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {!manual ? (
              <>
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-600">
                  <Sparkles className="h-4 w-4" />
                  {t('upload.suggestTitle')}
                </div>
                <div className="space-y-2.5">
                  {folderSuggestions.length === 0 && (
                    <p className="rounded-2xl bg-slate-50 px-4 py-4 text-center text-sm text-slate-400">
                      {t('upload.noFolders')}
                    </p>
                  )}
                  {folderSuggestions.map((s, i) => {
                    const folder = folders.find((f) => f.id === s.folderId)
                    const active = picked === s.folderId
                    return (
                      <motion.button
                        key={s.folderId}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                        onClick={() => setPicked(s.folderId)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors',
                          active ? 'border-ink-300 bg-ink-50' : 'border-slate-200 bg-white hover:bg-slate-50',
                        )}
                      >
                        <div className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-xl', toneClasses(folder?.tone ?? 'indigo').soft)}>
                          <FolderGlyph name={folder?.icon ?? 'Folder'} className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-semibold text-slate-800">{s.folderName}</p>
                            {i === 0 && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">{t('upload.bestMatch')}</span>}
                          </div>
                          <p className="mt-0.5 line-clamp-1 text-xs text-slate-400">{s.reason}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <ConfidenceMeter value={s.confidence} />
                          <span className={cn('grid h-5 w-5 place-items-center rounded-full border', active ? 'border-ink-600 bg-ink-600 text-white' : 'border-slate-300')}>
                            {active && <Check className="h-3 w-3" />}
                          </span>
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
                <div className="mt-5 flex gap-2">
                  <Button variant="glass" className="flex-1" onClick={() => setManual(true)}>{t('upload.manual')}</Button>
                  <Button className="flex-1" onClick={confirmUpload}>
                    <FolderInput className="h-4 w-4" />
                    {t('upload.saveHere')}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-600">
                  <FolderInput className="h-4 w-4" />
                  {t('upload.manualTitle')}
                </div>
                <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
                  {/* Lưu vào gốc (không thư mục) */}
                  <FolderPick
                    active={picked === ''}
                    onClick={() => setPicked('')}
                    icon="Folder"
                    toneKey="slate"
                    name={t('upload.rootFolder')}
                  />
                  {folders.map((f) => (
                    <FolderPick
                      key={f.id}
                      active={picked === f.id}
                      onClick={() => setPicked(f.id)}
                      icon={f.icon}
                      toneKey={f.tone}
                      name={f.name}
                      meta={t('files.folderMeta', { count: f.fileCount, size: formatBytes(f.size) })}
                    />
                  ))}
                </div>
                <div className="mt-5 flex gap-2">
                  <Button variant="glass" className="flex-1" onClick={() => setManual(false)}>{t('upload.back')}</Button>
                  <Button className="flex-1" onClick={confirmUpload}>
                    <FolderInput className="h-4 w-4" />
                    {t('upload.saveHere')}
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* UPLOADING */}
        {stage === 'uploading' && (
          <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-10 text-center">
            <div className="mx-auto mb-5 grid h-16 w-16 place-items-center">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-ink-500" />
            </div>
            <p className="text-sm font-semibold text-slate-700">
              {t('upload.uploading', { done: uploaded, total: pendingFiles.length })}
            </p>
            <div className="mx-auto mt-4 h-1.5 w-48 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-brand transition-all"
                style={{ width: `${pendingFiles.length ? (uploaded / pendingFiles.length) * 100 : 0}%` }}
              />
            </div>
          </motion.div>
        )}

        {/* DONE */}
        {stage === 'done' && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-8 text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 15 }} className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-full bg-gradient-mint shadow-glow-mint">
              <Check className="h-10 w-10 text-white" strokeWidth={3} />
            </motion.div>
            <h3 className="text-xl font-bold text-slate-900">{t('upload.doneTitle')}</h3>
            <p className="mt-1 text-sm text-slate-500">
              {t('upload.donePre')} <span className="font-semibold text-slate-800">{folders.find((f) => f.id === picked)?.name ?? t('upload.storageFallback')}</span> {t('upload.donePost')}
            </p>
            {failed > 0 && (
              <p className="mt-2 text-xs font-semibold text-amber-600">{t('upload.someFailed', { count: failed })}</p>
            )}
            <Button className="mt-6 w-full" onClick={onClose}>{t('upload.great')}</Button>
          </motion.div>
        )}

        {/* ERROR */}
        {stage === 'error' && (
          <motion.div key="error" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-8 text-center">
            <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-full bg-rose-100">
              <AlertTriangle className="h-10 w-10 text-rose-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">{t('upload.errorTitle')}</h3>
            <p className="mt-1 text-sm text-slate-500">
              {pendingFiles.length > 1 ? t('upload.errorDescMulti', { count: pendingFiles.length }) : t('upload.errorDescOne')}
            </p>
            <div className="mt-6 flex gap-2">
              <Button variant="glass" className="flex-1" onClick={onClose}>{t('upload.close')}</Button>
              <Button className="flex-1" onClick={confirmUpload}>{t('upload.retry')}</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  )
}

/** Một dòng thư mục chọn được trong chế độ "Chọn thủ công". */
function FolderPick({
  active,
  onClick,
  icon,
  toneKey,
  name,
  meta,
}: {
  active: boolean
  onClick: () => void
  icon: string
  toneKey: string
  name: string
  meta?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-colors',
        active ? 'border-ink-300 bg-ink-50' : 'border-slate-200 bg-white hover:bg-slate-50',
      )}
    >
      <div className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-lg', toneClasses(toneKey).soft)}>
        <FolderGlyph name={icon} className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-800">{name}</p>
        {meta && <p className="truncate text-xs text-slate-400">{meta}</p>}
      </div>
      <span className={cn('grid h-5 w-5 shrink-0 place-items-center rounded-full border', active ? 'border-ink-600 bg-ink-600 text-white' : 'border-slate-300')}>
        {active && <Check className="h-3 w-3" />}
      </span>
    </button>
  )
}
