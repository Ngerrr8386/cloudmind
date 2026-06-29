import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  LayoutGrid,
  List,
  Sparkles,
  ArrowUpDown,
  Star,
  FileText,
  Image as ImageIcon,
  Video as VideoIcon,
  Table2,
  FolderOpen,
  FolderPlus,
  ChevronDown,
  Check,
  SearchX,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  Button,
  Badge,
  GlassCard,
  FolderGlyph,
  AIChip,
} from '@/components/ui'
import { PageHeader } from '@/components/shared/PageHeader'
import { FileCard, FileRow } from '@/components/shared/FileCard'
import { EmptyState } from '@/components/shared/EmptyState'
import type { StoredFile, Folder, FileType } from '@/lib/types'
import { cn, formatBytes } from '@/lib/utils'
import { staggerContainer, fadeUp, scaleIn, softSpring } from '@/lib/motion'
import { useAppContext } from '@/lib/hooks'
import { tone } from '@/lib/theme'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { useAsync } from '@/lib/useApi'

type ViewMode = 'grid' | 'list'

/** A file filter that maps to either a set of FileTypes or the "starred" flag. */
interface FileFilter {
  id: string
  label: string
  icon: LucideIcon
  types?: FileType[]
  starred?: boolean
}

const FILE_FILTERS: FileFilter[] = [
  { id: 'all', label: 'Tất cả', icon: FolderOpen },
  { id: 'pdf', label: 'PDF', icon: FileText, types: ['pdf', 'doc', 'note', 'slide'] },
  { id: 'image', label: 'Ảnh', icon: ImageIcon, types: ['image'] },
  { id: 'video', label: 'Video', icon: VideoIcon, types: ['video', 'audio'] },
  { id: 'sheet', label: 'Bảng tính', icon: Table2, types: ['sheet'] },
  { id: 'starred', label: 'Đánh dấu sao', icon: Star, starred: true },
]

const SORT_OPTIONS = [
  { id: 'recent', label: 'Mới sửa gần đây' },
  { id: 'name', label: 'Tên A → Z' },
  { id: 'size', label: 'Dung lượng lớn nhất' },
  { id: 'ai', label: 'Đã xử lý AI' },
] as const

type SortId = (typeof SORT_OPTIONS)[number]['id']

export function FilesPage() {
  const { openUpload, dataNonce, refreshData } = useAppContext()
  const { user } = useAuth()
  const [toast, setToast] = useState('')
  const [view, setView] = useState<ViewMode>('grid')
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [sort, setSort] = useState<SortId>('recent')
  const [sortOpen, setSortOpen] = useState(false)

  const { data: foldersData, loading: foldersLoading } = useAsync(
    () => api.folders() as Promise<Folder[]>,
    [dataNonce],
  )
  const folders = useMemo<Folder[]>(() => foldersData ?? [], [foldersData])

  const { data: filesData, loading: filesLoading, reload: reloadFiles } = useAsync(
    () =>
      api
        .files({ limit: 100 })
        .then((r) =>
          (r.items ?? []).map(
            (f: Omit<StoredFile, 'owner'>): StoredFile => ({
              ...f,
              owner: user?.name ?? '',
            }),
          ),
        ),
    [user?.name, dataNonce],
  )
  const files = useMemo<StoredFile[]>(() => filesData ?? [], [filesData])

  const loading = foldersLoading || filesLoading

  /** Sao 1 file rồi tải lại danh sách. */
  const handleStar = async (id: string) => {
    try {
      await api.starFile(id)
    } catch {
      /* coi như rỗng — không để app crash */
    }
    reloadFiles()
  }

  /** Mở link tải file (signed URL từ backend). */
  const handleDownload = async (id: string) => {
    try {
      const { url } = await api.downloadUrl(id)
      if (url) window.open(url, '_blank', 'noopener')
    } catch {
      /* coi như rỗng — không để app crash */
    }
  }

  /** Tạo link chia sẻ + sao chép vào clipboard. */
  const showToast = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(''), 2500) }
  const handleShare = async (id: string) => {
    try {
      const res = await api.shareFile(id, { permission: 'view' })
      const link = `${window.location.origin}${res.link ?? `/share/${res.token}`}`
      await navigator.clipboard?.writeText(link).catch(() => {})
      showToast('Đã sao chép link chia sẻ ✨')
    } catch {
      showToast('Không tạo được link chia sẻ')
    }
  }

  /** Chuyển file vào thùng rác rồi tải lại. */
  const handleTrash = async (id: string) => {
    try { await api.trashFile(id) } catch { /* ignore */ }
    reloadFiles()
    showToast('Đã chuyển vào thùng rác 🗑️')
  }

  /** Tạo thư mục mới. */
  const handleCreateFolder = async () => {
    const name = window.prompt('Tên thư mục mới:')?.trim()
    if (!name) return
    try { await api.createFolder({ name }) } catch { /* ignore */ }
    refreshData()
  }

  /** Click vào file: tải xuống (sao khi đang ở bộ lọc "Đánh dấu sao"). */
  const handleFileClick = (file: StoredFile) => {
    if (activeFilter === 'starred') handleStar(file.id)
    else handleDownload(file.id)
  }

  const fileActions = (file: StoredFile) => ({
    onStar: () => handleStar(file.id),
    onDownload: () => handleDownload(file.id),
    onShare: () => handleShare(file.id),
    onTrash: () => handleTrash(file.id),
  })

  const filteredFiles = useMemo<StoredFile[]>(() => {
    const f = FILE_FILTERS.find((x) => x.id === activeFilter) ?? FILE_FILTERS[0]
    let result = files.filter((file) => {
      if (f.starred) return file.starred
      if (f.types) return f.types.includes(file.type)
      return true
    })

    result = [...result].sort((a, b) => {
      switch (sort) {
        case 'name':
          return a.name.localeCompare(b.name, 'vi')
        case 'size':
          return b.size - a.size
        case 'ai':
          return Number(b.aiProcessed) - Number(a.aiProcessed)
        case 'recent':
        default:
          return b.updatedAt.localeCompare(a.updatedAt)
      }
    })
    return result
  }, [activeFilter, sort, files])

  const totalSize = useMemo(
    () => files.reduce((sum, f) => sum + f.size, 0),
    [files],
  )

  const activeSortLabel =
    SORT_OPTIONS.find((o) => o.id === sort)?.label ?? 'Sắp xếp'

  return (
    <div className="pb-16">
      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
            <FolderOpen className="h-3.5 w-3.5 text-indigo-600" />
            {folders.length} thư mục · {files.length} file
          </span>
        }
        title="Kho lưu trữ"
        subtitle={`Tất cả file của bạn ở một nơi, đã được AI sắp xếp gọn gàng — đang dùng ${formatBytes(
          totalSize,
        )} qua ${files.length} tài liệu. ✨`}
        actions={
          <>
            <ViewToggle view={view} onChange={setView} />
            <Button variant="primary" size="md" onClick={openUpload}>
              <Upload className="h-4 w-4" />
              Tải lên
            </Button>
          </>
        }
      />

      {/* AI suggestion banner */}
      <motion.div
        variants={scaleIn}
        initial="hidden"
        animate="show"
        className="mb-8"
      >
        <GlassCard
          glow
          className="relative overflow-hidden border-indigo-200 p-5 sm:p-6"
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-indigo-50 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-10 h-40 w-40 rounded-full bg-sky-50 blur-3xl" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <motion.div
                className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-indigo-600 shadow-glow"
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Sparkles className="h-6 w-6 text-white" />
              </motion.div>
              <div>
                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                  <AIChip label="AI đề xuất" />
                  <Badge tone="mint" dot>
                    Tiết kiệm ~2.1 GB
                  </Badge>
                </div>
                <p className="text-sm font-bold leading-snug text-slate-900 sm:text-base">
                  Gộp 14 file trùng &amp; dọn 6 bản nháp cũ 🧹
                </p>
                <p className="mt-1 max-w-md text-xs text-slate-500">
                  Mình soi thấy mấy bản &quot;final FINAL v3&quot; na ná nhau —
                  để mình dọn cho gọn nha, bạn duyệt 1 chạm là xong.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end lg:flex-row lg:items-center">
              <Button variant="glass" size="md" className="w-full sm:w-auto">
                Xem đề xuất
              </Button>
              <Button variant="ghost" size="md" className="w-full sm:w-auto">
                Để sau
              </Button>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Folders section */}
      <section className="mb-10">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900">Thư mục</h2>
            <p className="text-xs text-slate-400">
              Đã được AI nhóm theo chủ đề
            </p>
          </div>
          <button
            onClick={handleCreateFolder}
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 transition-colors hover:text-indigo-700"
          >
            <FolderPlus className="h-3.5 w-3.5" /> Tạo thư mục
          </button>
        </div>

        <motion.div
          variants={staggerContainer(0.05)}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6"
        >
          {folders.map((folder: Folder) => (
            <motion.div key={folder.id} variants={fadeUp}>
              <GlassCard
                interactive
                className="group h-full p-4"
                whileHover={{ y: -4 }}
                transition={softSpring}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={cn(
                      'grid h-12 w-12 place-items-center rounded-2xl shadow-card transition-transform duration-300 group-hover:scale-105',
                      tone(folder.tone).soft,
                    )}
                  >
                    <FolderGlyph name={folder.icon} className="h-6 w-6" />
                  </div>
                  <ChevronDown className="h-4 w-4 -rotate-90 text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-slate-500" />
                </div>
                <p className="mt-3 truncate text-sm font-bold text-slate-900">{folder.name}</p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {folder.fileCount} file · {formatBytes(folder.size)}
                </p>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Files toolbar */}
      <section>
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Filter chips */}
          <div className="no-scrollbar -mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1">
            {FILE_FILTERS.map((f) => {
              const isActive = activeFilter === f.id
              const Icon = f.icon
              return (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  className={cn(
                    'relative inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors',
                    isActive
                      ? 'border-transparent text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:text-slate-700',
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="files-filter-pill"
                      className="absolute inset-0 rounded-full bg-indigo-600 shadow-glow"
                      transition={softSpring}
                    />
                  )}
                  <span className="relative z-10 inline-flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5" />
                    {f.label}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Sort dropdown */}
          <div className="relative shrink-0">
            <button
              onClick={() => setSortOpen((v) => !v)}
              className="inline-flex w-full items-center justify-between gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900 lg:w-auto"
            >
              <span className="inline-flex items-center gap-2">
                <ArrowUpDown className="h-3.5 w-3.5 text-indigo-600" />
                {activeSortLabel}
              </span>
              <ChevronDown
                className={cn(
                  'h-3.5 w-3.5 text-slate-400 transition-transform',
                  sortOpen && 'rotate-180',
                )}
              />
            </button>
            <AnimatePresence>
              {sortOpen && (
                <>
                  <button
                    className="fixed inset-0 z-20 cursor-default"
                    aria-label="Đóng menu sắp xếp"
                    onClick={() => setSortOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={softSpring}
                    className="glass-strong absolute right-0 z-30 mt-2 w-52 overflow-hidden rounded-2xl border border-slate-200 p-1.5 shadow-card"
                  >
                    {SORT_OPTIONS.map((opt) => {
                      const selected = opt.id === sort
                      return (
                        <button
                          key={opt.id}
                          onClick={() => {
                            setSort(opt.id)
                            setSortOpen(false)
                          }}
                          className={cn(
                            'flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium transition-colors',
                            selected
                              ? 'bg-slate-100 text-slate-900'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                          )}
                        >
                          {opt.label}
                          {selected && <Check className="h-3.5 w-3.5 text-emerald-600" />}
                        </button>
                      )
                    })}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Files area */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid place-items-center rounded-3xl border border-slate-200 bg-white px-6 py-20"
            >
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-500" />
              <p className="mt-3 text-xs text-slate-400">Đang tải kho lưu trữ…</p>
            </motion.div>
          ) : filteredFiles.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <EmptyState
                icon={SearchX}
                title={
                  files.length === 0
                    ? 'Chưa có tài liệu nào 🫥'
                    : 'Trống trơn ở đây luôn 🫥'
                }
                description={
                  files.length === 0
                    ? 'Kho của bạn đang trống — hãy tải tài liệu đầu tiên lên nha!'
                    : 'Không có file nào khớp bộ lọc này. Thử đổi bộ lọc hoặc tải thêm file lên nha!'
                }
                action={
                  <Button variant="primary" size="md" onClick={openUpload}>
                    <Upload className="h-4 w-4" />
                    Tải lên ngay
                  </Button>
                }
              />
            </motion.div>
          ) : view === 'grid' ? (
            <motion.div
              key="grid"
              variants={staggerContainer(0.04)}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              {filteredFiles.map((file) => (
                <FileCard
                  key={file.id}
                  file={file}
                  onClick={() => handleFileClick(file)}
                  {...fileActions(file)}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <GlassCard className="p-2 sm:p-3">
                {/* Header row */}
                <div className="flex items-center gap-3 border-b border-slate-200 px-3 pb-2.5 pt-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  <span className="h-11 w-11 shrink-0" aria-hidden />
                  <span className="flex-1">Tên</span>
                  <span className="hidden shrink-0 items-center gap-6 sm:flex">
                    <span className="w-16 text-right">Kích thước</span>
                    <span className="w-24 text-right">Sửa đổi</span>
                  </span>
                  <span className="h-4 w-4 shrink-0" aria-hidden />
                </div>
                <motion.div
                  variants={staggerContainer(0.03)}
                  initial="hidden"
                  animate="show"
                  className="mt-1 flex flex-col gap-0.5"
                >
                  {filteredFiles.map((file) => (
                    <FileRow
                      key={file.id}
                      file={file}
                      onClick={() => handleFileClick(file)}
                      {...fileActions(file)}
                    />
                  ))}
                </motion.div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer count */}
        {filteredFiles.length > 0 && (
          <p className="mt-5 text-center text-xs text-slate-400">
            Đang hiển thị {filteredFiles.length} / {files.length} file 💾
          </p>
        )}
      </section>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Segmented grid/list view toggle. */
function ViewToggle({
  view,
  onChange,
}: {
  view: ViewMode
  onChange: (v: ViewMode) => void
}) {
  const options: { id: ViewMode; icon: LucideIcon; label: string }[] = [
    { id: 'grid', icon: LayoutGrid, label: 'Dạng lưới' },
    { id: 'list', icon: List, label: 'Dạng danh sách' },
  ]
  return (
    <div className="relative flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-1">
      {options.map((opt) => {
        const isActive = view === opt.id
        const Icon = opt.icon
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            aria-label={opt.label}
            aria-pressed={isActive}
            className={cn(
              'relative grid h-8 w-8 place-items-center rounded-full transition-colors',
              isActive ? 'text-white' : 'text-slate-400 hover:text-slate-700',
            )}
          >
            {isActive && (
              <motion.span
                layoutId="files-view-toggle"
                className="absolute inset-0 rounded-full bg-indigo-600 shadow-glow"
                transition={softSpring}
              />
            )}
            <Icon className="relative z-10 h-4 w-4" />
          </button>
        )
      })}
    </div>
  )
}