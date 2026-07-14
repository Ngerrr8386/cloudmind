import { useMemo, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  LayoutGrid,
  List,
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
  Trash2,
  RotateCcw,
  Users,
  Loader2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  Button,
  Badge,
  GlassCard,
  FolderGlyph,
  useFileTypeLabel,
} from '@/components/ui'
import { PageHeader } from '@/components/shared/PageHeader'
import { FileCard, FileRow } from '@/components/shared/FileCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { ShareModal } from '@/components/shared/ShareModal'
import type { StoredFile, Folder, FileType } from '@/lib/types'
import { cn, formatBytes } from '@/lib/utils'
import { staggerContainer, fadeUp, softSpring } from '@/lib/motion'
import { useAppContext } from '@/lib/hooks'
import { tone } from '@/lib/theme'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { useAsync } from '@/lib/useApi'
import { useT, type TranslationKey } from '@/lib/i18n'

type ViewMode = 'grid' | 'list'

/** A file filter that maps to either a set of FileTypes or the "starred" flag. */
interface FileFilter {
  id: string
  label: string
  icon: LucideIcon
  types?: FileType[]
  starred?: boolean
}

// `id` is the stable filter key (logic); `label` is the raw VN kept as
// reference only — the visible chip text is resolved via `filterLabel()`.
const FILE_FILTERS: FileFilter[] = [
  { id: 'all', label: 'Tất cả', icon: FolderOpen },
  { id: 'pdf', label: 'PDF', icon: FileText, types: ['pdf', 'doc', 'note', 'slide'] },
  { id: 'image', label: 'Ảnh', icon: ImageIcon, types: ['image'] },
  { id: 'video', label: 'Video', icon: VideoIcon, types: ['video', 'audio'] },
  { id: 'sheet', label: 'Bảng tính', icon: Table2, types: ['sheet'] },
  { id: 'starred', label: 'Đánh dấu sao', icon: Star, starred: true },
]

// `id` is the stable sort key (logic); `label` is the raw VN kept as
// reference only — the visible text is resolved via `SORT_LABEL_KEY`.
const SORT_OPTIONS = [
  { id: 'recent', label: 'Mới sửa gần đây' },
  { id: 'name', label: 'Tên A → Z' },
  { id: 'size', label: 'Dung lượng lớn nhất' },
  { id: 'ai', label: 'Đã xử lý AI' },
] as const

type SortId = (typeof SORT_OPTIONS)[number]['id']

/** Display label key for each sort option — `id` stays the stable logic key. */
const SORT_LABEL_KEY: Record<SortId, TranslationKey> = {
  recent: 'files.sortRecent',
  name: 'files.sortName',
  size: 'files.sortSize',
  ai: 'files.sortAi',
}

export function FilesPage() {
  const { openUpload, dataNonce, refreshData } = useAppContext()
  const { user } = useAuth()
  const t = useT()
  const fileLabel = useFileTypeLabel()
  const [toast, setToast] = useState('')
  const [view, setView] = useState<ViewMode>('grid')
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [sort, setSort] = useState<SortId>('recent')
  const [sortOpen, setSortOpen] = useState(false)
  const [viewTrash, setViewTrash] = useState(false)
  const [shareFile, setShareFile] = useState<{ id: string; name: string } | null>(null)
  const [openFolder, setOpenFolder] = useState<Folder | null>(null)

  const { data: foldersData, loading: foldersLoading } = useAsync(
    () => api.folders() as Promise<Folder[]>,
    [dataNonce],
  )
  const folders = useMemo<Folder[]>(() => foldersData ?? [], [foldersData])

  // Thư mục trong thùng rác — chỉ tải khi đang xem thùng rác.
  const { data: trashedFoldersData, reload: reloadTrashedFolders } = useAsync(
    () => (viewTrash ? (api.trashedFolders() as Promise<Folder[]>) : Promise.resolve([] as Folder[])),
    [viewTrash, dataNonce],
  )
  const trashedFolders = useMemo<Folder[]>(() => trashedFoldersData ?? [], [trashedFoldersData])

  // Chỉ tải workspace khi người dùng thuộc gói Team — để bật hành động "Chia sẻ vào nhóm".
  const isTeam = (user?.plan ?? '').toLowerCase().includes('team')
  const { data: ws } = useAsync(
    () =>
      (isTeam ? api.currentWorkspace().catch(() => null) : Promise.resolve(null)) as Promise<{ myRole: string } | null>,
    [isTeam, dataNonce],
  )
  const canShareToWs = !!ws && (ws.myRole === 'owner' || ws.myRole === 'wsadmin')
  const [sharingId, setSharingId] = useState<string | null>(null)

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

  // Danh sách file đã xoá (thùng rác) — tải riêng, chỉ khi bật chế độ xem thùng rác.
  const {
    data: trashedData,
    loading: trashedLoading,
    reload: reloadTrashed,
  } = useAsync(
    () =>
      viewTrash
        ? api
            .files({ trashed: true, limit: 100 })
            .then((r) =>
              (r.items ?? []).map(
                (f: Omit<StoredFile, 'owner'>): StoredFile => ({
                  ...f,
                  owner: user?.name ?? '',
                }),
              ),
            )
        : Promise.resolve([] as StoredFile[]),
    [viewTrash, user?.name, dataNonce],
  )
  const trashedFiles = useMemo<StoredFile[]>(() => trashedData ?? [], [trashedData])

  // Tự refresh khi còn file đang lập chỉ mục (pending/processing) để cập nhật badge.
  const anyEmbedding = useMemo(
    () => files.some((f) => f.embedStatus === 'pending' || f.embedStatus === 'processing'),
    [files],
  )
  useEffect(() => {
    if (!anyEmbedding) return
    const timer = window.setInterval(() => reloadFiles(), 3000)
    return () => window.clearInterval(timer)
  }, [anyEmbedding, reloadFiles])

  const loading = viewTrash ? trashedLoading : foldersLoading || filesLoading

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

  /** Mở hộp thoại quản lý chia sẻ cho file. */
  const showToast = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(''), 2500) }
  const handleShare = (id: string) => {
    const f = [...files, ...trashedFiles].find((x) => x.id === id)
    setShareFile({ id, name: f?.name ?? '' })
  }

  /** Chuyển file vào thùng rác rồi tải lại. */
  const handleTrash = async (id: string) => {
    try { await api.trashFile(id) } catch { /* ignore */ }
    reloadFiles()
    showToast(t('files.toastTrashed'))
  }

  /** Khôi phục file từ thùng rác rồi tải lại danh sách thùng rác + danh sách thường. */
  const handleRestore = async (id: string) => {
    try { await api.restoreFile(id) } catch { /* ignore */ }
    reloadTrashed()
    reloadFiles()
    showToast(t('files.toastRestored'))
  }

  /** Tạo thư mục mới. */
  const handleCreateFolder = async () => {
    const name = window.prompt(t('files.promptFolderName'))?.trim()
    if (!name) return
    try { await api.createFolder({ name }) } catch { /* ignore */ }
    refreshData()
  }

  /** Đưa thư mục cá nhân vào không gian nhóm. */
  const handleShareFolder = async (folder: Folder) => {
    setSharingId(folder.id)
    try {
      await api.attachFolderToWorkspace(folder.id)
      showToast(t('files.toastFolderShared'))
      refreshData()
    } catch (e) {
      showToast(e instanceof Error ? e.message : t('files.toastFolderShareFailed'))
    } finally {
      setSharingId(null)
    }
  }

  /** Gỡ thư mục khỏi không gian nhóm, trả về cá nhân. */
  const handleUnshareFolder = async (folder: Folder) => {
    if (!window.confirm(t('files.confirmUnshareFolder', { name: folder.name }))) return
    setSharingId(folder.id)
    try {
      await api.detachFolderFromWorkspace(folder.id)
      showToast(t('files.toastFolderUnshared'))
      refreshData()
    } catch (e) {
      showToast(e instanceof Error ? e.message : t('files.toastFolderUnshareFailed'))
    } finally {
      setSharingId(null)
    }
  }

  /** Chuyển thư mục vào thùng rác (xoá mềm). */
  const handleTrashFolder = async (folder: Folder) => {
    if (!window.confirm(t('files.confirmTrashFolder', { name: folder.name }))) return
    try {
      await api.deleteFolder(folder.id)
      showToast(t('files.folderTrashed'))
    } catch {
      showToast(t('files.folderActionFailed'))
    }
    refreshData()
    reloadTrashedFolders()
  }

  /** Khôi phục thư mục từ thùng rác. */
  const handleRestoreFolder = async (folder: Folder) => {
    try {
      await api.restoreFolder(folder.id)
      showToast(t('files.folderRestored'))
    } catch {
      showToast(t('files.folderActionFailed'))
    }
    refreshData()
    reloadTrashedFolders()
  }

  /** Xoá vĩnh viễn thư mục trong thùng rác. */
  const handlePermanentFolder = async (folder: Folder) => {
    if (!window.confirm(t('files.confirmFolderPermanent', { name: folder.name }))) return
    try {
      await api.permanentDeleteFolder(folder.id)
    } catch {
      showToast(t('files.folderActionFailed'))
    }
    reloadTrashedFolders()
  }

  /** Click vào file: ở thùng rác → khôi phục; "Đánh dấu sao" → sao; còn lại → tải xuống. */
  const handleFileClick = (file: StoredFile) => {
    if (viewTrash) handleRestore(file.id)
    else if (activeFilter === 'starred') handleStar(file.id)
    else handleDownload(file.id)
  }

  // Ở chế độ thùng rác chỉ hiện hành động "Khôi phục"; bình thường hiện đủ menu.
  const fileActions = (file: StoredFile) =>
    viewTrash
      ? { onRestore: () => handleRestore(file.id) }
      : {
          onStar: () => handleStar(file.id),
          onDownload: () => handleDownload(file.id),
          onShare: () => handleShare(file.id),
          onTrash: () => handleTrash(file.id),
        }

  const filteredFiles = useMemo<StoredFile[]>(() => {
    // Ở thùng rác: bỏ qua bộ lọc loại/sao, chỉ hiển thị toàn bộ file đã xoá.
    const source = viewTrash ? trashedFiles : files
    const f = FILE_FILTERS.find((x) => x.id === activeFilter) ?? FILE_FILTERS[0]
    let result = viewTrash
      ? [...source]
      : source.filter((file) => {
          if (openFolder && file.folderId !== openFolder.id) return false
          if (f.starred) return file.starred
          if (f.types) return f.types.includes(file.type)
          return true
        })

    result = result.sort((a, b) => {
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
  }, [activeFilter, sort, files, viewTrash, trashedFiles, openFolder])

  const totalSize = useMemo(
    () => files.reduce((sum, f) => sum + f.size, 0),
    [files],
  )

  const activeSortLabel = t(SORT_LABEL_KEY[sort])

  // Filter `id` is the stable logic key; the chip label is display-only.
  const filterLabel = (f: FileFilter): string => {
    switch (f.id) {
      case 'all':
        return t('files.filterAll')
      case 'starred':
        return t('file.star')
      case 'pdf':
        return fileLabel('pdf')
      case 'image':
        return fileLabel('image')
      case 'video':
        return fileLabel('video')
      case 'sheet':
        return fileLabel('sheet')
      default:
        return f.label
    }
  }

  return (
    <div className="pb-16">
      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
            <FolderOpen className="h-3.5 w-3.5 text-indigo-600" />
            {t('files.headerCount', { folders: folders.length, files: files.length })}
          </span>
        }
        title={t('nav.files')}
        subtitle={t('files.subtitle', {
          size: formatBytes(totalSize),
          count: files.length,
        })}
        actions={
          <>
            <ViewToggle view={view} onChange={setView} />
            <Button variant="primary" size="md" onClick={openUpload}>
              <Upload className="h-4 w-4" />
              {t('topbar.upload')}
            </Button>
          </>
        }
      />

      {/* Folders section */}
      <section className="mb-10">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900">
              {viewTrash ? t('files.trashFoldersTitle') : t('dashboard.folders')}
            </h2>
            <p className="text-xs text-slate-400">{viewTrash ? '' : t('files.foldersHint')}</p>
          </div>
          {!viewTrash && (
            <button
              onClick={handleCreateFolder}
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 transition-colors hover:text-indigo-700"
            >
              <FolderPlus className="h-3.5 w-3.5" /> {t('files.createFolder')}
            </button>
          )}
        </div>

        {viewTrash && trashedFolders.length === 0 && (
          <p className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">
            {t('files.trashFoldersEmpty')}
          </p>
        )}

        <motion.div
          variants={staggerContainer(0.05)}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6"
        >
          {(viewTrash ? trashedFolders : folders).map((folder: Folder) => (
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
                  <div className="flex items-center gap-1">
                    {viewTrash ? (
                      <>
                        <button
                          type="button"
                          title={t('file.restore')}
                          onClick={() => handleRestoreFolder(folder)}
                          className="grid h-8 w-8 place-items-center rounded-full bg-mint-50 text-mint-600 transition-colors hover:bg-mint-100"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title={t('files.folderPermanent')}
                          onClick={() => handlePermanentFolder(folder)}
                          className="grid h-8 w-8 place-items-center rounded-full text-slate-300 transition-colors hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    ) : folder.workspaceId ? (
                      <button
                        type="button"
                        title={t('files.removeFromTeam')}
                        disabled={sharingId === folder.id}
                        onClick={() => handleUnshareFolder(folder)}
                        className="grid h-8 w-8 place-items-center rounded-full bg-indigo-50 text-indigo-600 transition-colors hover:bg-indigo-100"
                      >
                        {sharingId === folder.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
                      </button>
                    ) : (
                      <>
                        {canShareToWs && (
                          <button
                            type="button"
                            title={t('files.shareToTeam')}
                            disabled={sharingId === folder.id}
                            onClick={() => handleShareFolder(folder)}
                            className="grid h-8 w-8 place-items-center rounded-full text-slate-300 opacity-0 transition-all hover:bg-slate-100 hover:text-indigo-600 group-hover:opacity-100"
                          >
                            {sharingId === folder.id ? <Loader2 className="h-4 w-4 animate-spin text-indigo-600" /> : <Users className="h-4 w-4" />}
                          </button>
                        )}
                        <button
                          type="button"
                          title={t('file.delete')}
                          onClick={() => handleTrashFolder(folder)}
                          className="grid h-8 w-8 place-items-center rounded-full text-slate-300 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenFolder(folder)}
                  disabled={viewTrash}
                  className="mt-3 block w-full text-left disabled:cursor-default"
                >
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-bold text-slate-900 transition-colors group-hover:text-indigo-600">
                      {folder.name}
                    </p>
                    {folder.workspaceId && <Badge tone="brand">{t('files.teamBadge')}</Badge>}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {t('files.folderMeta', { count: folder.fileCount, size: formatBytes(folder.size) })}
                  </p>
                </button>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Files toolbar */}
      <section>
        <AnimatePresence>
          {viewTrash && (
            <motion.div
              key="trash-banner"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={softSpring}
              className="mb-4 flex items-center gap-2.5 rounded-2xl border border-rose-200 bg-rose-50/70 px-4 py-2.5"
            >
              <Trash2 className="h-4 w-4 shrink-0 text-rose-500" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900">
                  {t('files.trashBanner', { count: trashedFiles.length })}
                </p>
                <p className="text-xs text-slate-500">
                  {t('files.trashDesc')}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewTrash(false)}>
                {t('files.exit')}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {!viewTrash && openFolder && (
          <div className="mb-4 flex items-center gap-2.5 rounded-2xl border border-indigo-200 bg-indigo-50/70 px-4 py-2.5">
            <div className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-xl', tone(openFolder.tone).soft)}>
              <FolderGlyph name={openFolder.icon} className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-900">{openFolder.name}</p>
              <p className="text-xs text-slate-500">
                {t('files.folderMeta', { count: openFolder.fileCount, size: formatBytes(openFolder.size) })}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setOpenFolder(null)}>
              {t('files.allFiles')}
            </Button>
          </div>
        )}

        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Filter chips */}
          <div className="no-scrollbar -mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1">
            {FILE_FILTERS.map((f) => {
              const isActive = !viewTrash && activeFilter === f.id
              const Icon = f.icon
              return (
                <button
                  key={f.id}
                  onClick={() => {
                    setViewTrash(false)
                    setActiveFilter(f.id)
                  }}
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
                    {filterLabel(f)}
                  </span>
                </button>
              )
            })}

            {/* Divider + Thùng rác toggle */}
            <span className="mx-0.5 h-5 w-px shrink-0 bg-slate-200" aria-hidden />
            <button
              onClick={() => setViewTrash((v) => !v)}
              aria-pressed={viewTrash}
              className={cn(
                'relative inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors',
                viewTrash
                  ? 'border-transparent text-white'
                  : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-rose-200 hover:text-rose-600',
              )}
            >
              {viewTrash && (
                <motion.span
                  layoutId="files-trash-pill"
                  className="absolute inset-0 rounded-full bg-rose-500 shadow-glow"
                  transition={softSpring}
                />
              )}
              <span className="relative z-10 inline-flex items-center gap-1.5">
                <Trash2 className="h-3.5 w-3.5" />
                {t('files.trash')}
              </span>
            </button>
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
                    aria-label={t('files.closeSortMenu')}
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
                          {t(SORT_LABEL_KEY[opt.id])}
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
              <p className="mt-3 text-xs text-slate-400">
                {viewTrash ? t('files.loadingTrash') : t('files.loadingFiles')}
              </p>
            </motion.div>
          ) : filteredFiles.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {viewTrash ? (
                <EmptyState
                  icon={Trash2}
                  title={t('files.trashEmptyTitle')}
                  description={t('files.trashEmptyDesc')}
                  action={
                    <Button variant="glass" size="md" onClick={() => setViewTrash(false)}>
                      <FolderOpen className="h-4 w-4" />
                      {t('files.backToFiles')}
                    </Button>
                  }
                />
              ) : (
                <EmptyState
                  icon={SearchX}
                  title={
                    files.length === 0
                      ? t('files.emptyNoDocsTitle')
                      : t('files.emptyFilterTitle')
                  }
                  description={
                    files.length === 0
                      ? t('files.emptyNoDocsDesc')
                      : t('files.emptyFilterDesc')
                  }
                  action={
                    <Button variant="primary" size="md" onClick={openUpload}>
                      <Upload className="h-4 w-4" />
                      {t('files.uploadNow')}
                    </Button>
                  }
                />
              )}
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
                  <span className="flex-1">{t('files.colName')}</span>
                  <span className="hidden shrink-0 items-center gap-6 sm:flex">
                    <span className="w-16 text-right">{t('files.colSize')}</span>
                    <span className="w-24 text-right">{t('files.colModified')}</span>
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
            {viewTrash
              ? t('files.trashFooter', { count: filteredFiles.length })
              : t('files.showingCount', { shown: filteredFiles.length, total: files.length })}
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

      <ShareModal file={shareFile} onClose={() => setShareFile(null)} />
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
  const t = useT()
  const options: { id: ViewMode; icon: LucideIcon; label: string }[] = [
    { id: 'grid', icon: LayoutGrid, label: t('files.viewGrid') },
    { id: 'list', icon: List, label: t('files.viewList') },
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