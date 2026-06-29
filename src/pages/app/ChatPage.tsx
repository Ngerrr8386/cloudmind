import { useState, useRef, useEffect, useCallback, forwardRef, type FormEvent, type KeyboardEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  Sparkles,
  Brain,
  ChevronDown,
  FileText,
  Plus,
  CornerDownLeft,
  CheckCircle2,
  Bot,
} from 'lucide-react'
import { Button, Badge, AIChip, Avatar, FileTypeIcon, fileTint } from '@/components/ui'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { useAsync } from '@/lib/useApi'
import type { ChatMessage, ChatSource, StoredFile } from '@/lib/types'
import type { Tone } from '@/lib/theme'
import { cn, timeAgo } from '@/lib/utils'
import { staggerContainer, fadeUp, popIn, spring } from '@/lib/motion'

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

/** Render a single line of content, supporting simple **bold** segments. */
function renderInline(line: string) {
  const parts = line.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-bold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return <span key={i}>{part}</span>
  })
}

/** Render content with newline support + inline bold. */
function RichContent({ content }: { content: string }) {
  const lines = content.split('\n')
  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {lines.map((line, i) =>
        line.trim() === '' ? (
          <div key={i} className="h-1.5" aria-hidden />
        ) : (
          <p key={i}>{renderInline(line)}</p>
        ),
      )}
    </div>
  )
}

/** Map message từ backend sang ChatMessage của UI. */
function toChatMessage(raw: any): ChatMessage {
  return {
    id: String(raw?.id ?? `m-${Date.now()}`),
    role: raw?.role === 'user' ? 'user' : 'assistant',
    content: raw?.content ?? '',
    timestamp: raw?.createdAt ?? new Date().toISOString(),
    sources: Array.isArray(raw?.sources)
      ? raw.sources.map(
          (s: any): ChatSource => ({
            fileId: s?.fileId ?? '',
            fileName: s?.fileName ?? '',
            fileType: 'doc',
            snippet: s?.snippet ?? '',
            relevance: s?.relevance ?? 0,
          }),
        )
      : undefined,
  }
}

/* ------------------------------------------------------------------ *
 * Typing indicator
 * ------------------------------------------------------------------ */

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-2 w-2 rounded-full bg-grape-500"
          animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Source card
 * ------------------------------------------------------------------ */

function SourceCard({ source }: { source: ChatSource }) {
  const pct = Math.round(source.relevance * 100)
  return (
    <motion.div
      variants={fadeUp}
      className="group rounded-2xl border border-slate-200 bg-slate-50 p-3 transition-colors hover:border-grape-400/40 hover:bg-slate-100"
    >
      <div className="flex items-start gap-2.5">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100">
          <FileTypeIcon type={source.fileType} className={cn('h-4.5 w-4.5', fileTint(source.fileType))} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-xs font-semibold text-slate-900">{source.fileName}</p>
            {source.page !== undefined && (
              <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                tr.{source.page}
              </span>
            )}
          </div>
          <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-500">{source.snippet}</p>
          <div className="mt-2 flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wide text-mint-500">khớp</span>
            <div className="h-1 w-14 overflow-hidden rounded-full bg-slate-100">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-mint-500 to-sky2-500"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            <span className="text-[10px] font-bold tabular-nums text-slate-600">{pct}%</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ *
 * Thinking accordion
 * ------------------------------------------------------------------ */

function ThinkingBlock({ thinking }: { thinking: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-grape-200 bg-grape-50">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left ring-focus"
      >
        <Brain className="h-3.5 w-3.5 text-grape-500" />
        <span className="text-[11px] font-bold text-grape-600">CloudMind đang suy nghĩ</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={spring} className="ml-auto text-grape-500">
          <ChevronDown className="h-3.5 w-3.5" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <p className="px-3 pb-3 text-[11px] leading-relaxed text-slate-500">{thinking}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Message bubble
 * ------------------------------------------------------------------ */

const MessageBubble = forwardRef<
  HTMLDivElement,
  { message: ChatMessage; userInitials: string; userTone: Tone }
>(function MessageBubble({ message, userInitials, userTone }, ref) {
  const isUser = message.role === 'user'
  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10 }}
      transition={spring}
      className={cn('flex w-full gap-3', isUser ? 'justify-end' : 'justify-start')}
    >
      {!isUser && (
        <div className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-gradient-brand shadow-glow">
          <Bot className="h-4.5 w-4.5 text-white" />
        </div>
      )}

      <div className={cn('flex max-w-[85%] flex-col gap-1 sm:max-w-[78%]', isUser && 'items-end')}>
        <div
          className={cn(
            'rounded-3xl px-4 py-3',
            isUser
              ? 'rounded-tr-md bg-gradient-brand text-white shadow-glow'
              : 'glass rounded-tl-md text-slate-800',
          )}
        >
          <RichContent content={message.content} />

          {!isUser && message.thinking && <ThinkingBlock thinking={message.thinking} />}

          {!isUser && message.sources && message.sources.length > 0 && (
            <div className="mt-3 border-t border-slate-200 pt-3">
              <div className="mb-2 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-grape-500" />
                <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Nguồn trích dẫn · {message.sources.length}
                </span>
              </div>
              <motion.div
                variants={staggerContainer(0.06)}
                initial="hidden"
                animate="show"
                className="grid gap-2 sm:grid-cols-2"
              >
                {message.sources.map((src) => (
                  <SourceCard key={`${message.id}-${src.fileId}`} source={src} />
                ))}
              </motion.div>
            </div>
          )}
        </div>
        <span className="px-1 text-[10px] text-slate-400">{timeAgo(message.timestamp)}</span>
      </div>

      {isUser && (
        <div className="mt-1 shrink-0">
          <Avatar initials={userInitials} tone={userTone} size="sm" />
        </div>
      )}
    </motion.div>
  )
})

/* ------------------------------------------------------------------ *
 * Empty hero
 * ------------------------------------------------------------------ */

function EmptyHero({
  onPick,
  fileCount,
  prompts,
}: {
  onPick: (prompt: string) => void
  fileCount: number
  prompts: string[]
}) {
  return (
    <motion.div
      variants={staggerContainer(0.08)}
      initial="hidden"
      animate="show"
      className="flex flex-1 flex-col items-center justify-center px-2 py-10 text-center"
    >
      <motion.div
        variants={popIn}
        className="relative mb-6 grid h-20 w-20 place-items-center rounded-4xl bg-gradient-brand shadow-glow"
      >
        <span className="absolute inset-0 rounded-4xl bg-gradient-brand opacity-60 blur-xl" aria-hidden />
        <motion.div
          animate={{ rotate: [0, 14, -10, 0], scale: [1, 1.12, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <Sparkles className="relative h-9 w-9 text-white" />
        </motion.div>
      </motion.div>

      <motion.h2 variants={fadeUp} className="max-w-md text-balance text-xl font-extrabold text-slate-900 sm:text-2xl">
        Mình đã đọc xong{' '}
        <span className="text-gradient">{fileCount} tài liệu</span> của bạn 🤓
      </motion.h2>
      <motion.p variants={fadeUp} className="mt-2 max-w-sm text-sm text-slate-500">
        Hỏi gì cũng được — mình trả lời kèm trích dẫn từ chính file của bạn. Bắt đầu bằng một gợi ý nha 👇
      </motion.p>

      <motion.div variants={fadeUp} className="mt-7 flex max-w-xl flex-wrap items-center justify-center gap-2.5">
        {prompts.map((prompt) => (
          <motion.button
            key={prompt}
            type="button"
            onClick={() => onPick(prompt)}
            whileHover={{ y: -3, scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={spring}
            className="group flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 ring-focus hover:border-grape-400/50 hover:bg-slate-100 hover:text-slate-900"
          >
            <Sparkles className="h-3.5 w-3.5 text-grape-500 transition-transform group-hover:rotate-12" />
            {prompt}
          </motion.button>
        ))}
      </motion.div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ *
 * Right context panel
 * ------------------------------------------------------------------ */

function ContextPanel({ files }: { files: StoredFile[] }) {
  const contextFiles = files.slice(0, 5)
  return (
    <aside className="hidden w-72 shrink-0 lg:block">
      <div className="sticky top-6 space-y-4">
        <div className="glass-strong rounded-3xl p-5">
          <div className="mb-1 flex items-center gap-2">
            <FileText className="h-4 w-4 text-grape-500" />
            <h3 className="text-sm font-bold text-slate-900">Nguồn tài liệu</h3>
          </div>
          <p className="mb-4 text-xs text-slate-500">
            {contextFiles.length} file đang được đưa vào ngữ cảnh trò chuyện
          </p>

          <motion.div variants={staggerContainer(0.06)} initial="hidden" animate="show" className="space-y-2">
            {contextFiles.map((file) => (
              <motion.div
                key={file.id}
                variants={fadeUp}
                whileHover={{ x: 3 }}
                transition={spring}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-2.5"
              >
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100">
                  <FileTypeIcon type={file.type} className={cn('h-4.5 w-4.5', fileTint(file.type))} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-900">{file.name}</p>
                  <p className="text-[10px] text-slate-400">{file.owner}</p>
                </div>
                <CheckCircle2 className="h-4 w-4 shrink-0 text-mint-500" />
              </motion.div>
            ))}
          </motion.div>
        </div>

        <div className="glass rounded-3xl p-5">
          <div className="mb-2 flex items-center gap-2">
            <Brain className="h-4 w-4 text-mint-500" />
            <h3 className="text-sm font-bold text-slate-900">Mẹo nhỏ</h3>
          </div>
          <p className="text-xs leading-relaxed text-slate-500">
            Hỏi càng cụ thể, mình trả lời càng chuẩn. Thử kèm tên file hoặc khoảng thời gian để khoanh vùng nhanh hơn nha! 💡
          </p>
        </div>
      </div>
    </aside>
  )
}

/* ------------------------------------------------------------------ *
 * Page
 * ------------------------------------------------------------------ */

export function ChatPage() {
  const { user } = useAuth()

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [typing, setTyping] = useState(false)
  const [convId, setConvId] = useState<string | null>(null)

  // Gợi ý câu hỏi từ AI
  const { data: suggestionsData } = useAsync(() => api.aiSuggestions(), [])
  const suggestedPrompts = suggestionsData?.suggestions ?? []

  // Tài liệu đang đưa vào ngữ cảnh (panel bên phải + đếm trong hero)
  const { data: filesData } = useAsync(
    () => api.files({ limit: 50 }).then((r) => r.items),
    [],
  )
  const contextFiles: StoredFile[] = (filesData ?? []).map((f: any) => ({
    ...f,
    owner: f.owner ?? user?.name ?? '',
  }))

  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Khởi tạo/đặt lại một cuộc trò chuyện rỗng khi mở trang.
  const initConversation = useCallback(async () => {
    try {
      const conv = await api.createConversation()
      setConvId(conv?.id ?? null)
    } catch {
      setConvId(null)
    }
  }, [])

  useEffect(() => {
    void initConversation()
  }, [initConversation])

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, typing, scrollToBottom])

  const sendMessage = useCallback(
    async (raw: string) => {
      const text = raw.trim()
      if (!text || typing) return

      const userMessage: ChatMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        content: text,
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, userMessage])
      setDraft('')
      setTyping(true)

      try {
        // Đảm bảo đã có conversation (tạo nếu chưa kịp khởi tạo).
        let id = convId
        if (!id) {
          const conv = await api.createConversation()
          id = conv?.id ?? null
          setConvId(id)
        }
        if (!id) return

        const reply = await api.sendMessage(id, text)
        setMessages((prev) => [...prev, toChatMessage(reply)])
      } catch {
        // Lỗi: bỏ qua phần trả lời, không để app crash.
      } finally {
        setTyping(false)
      }
    },
    [typing, convId],
  )

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    sendMessage(draft)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(draft)
    }
  }

  const resetChat = () => {
    setTyping(false)
    setMessages([])
    setDraft('')
    void initConversation()
  }

  const isEmpty = messages.length === 0

  return (
    <div className="flex gap-6">
      {/* Chat column */}
      <div className="flex min-h-[calc(100vh-7rem)] min-w-0 flex-1 flex-col">
        {/* Header strip */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring}
          className="glass-strong sticky top-0 z-10 mb-4 flex flex-wrap items-center gap-3 rounded-3xl px-4 py-3 sm:px-5"
        >
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-brand shadow-glow">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-base font-extrabold text-slate-900 sm:text-lg">Hỏi đáp tài liệu</h1>
              <AIChip label="RAG" />
            </div>
            <p className="hidden text-xs text-slate-500 sm:block">Trả lời kèm trích dẫn từ chính file của bạn</p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Badge tone="ai" dot className="hidden sm:inline-flex">
              CloudMind AI
            </Badge>
            <Button variant="glass" size="sm" onClick={resetChat} className="gap-1.5">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Cuộc trò chuyện mới</span>
              <span className="sm:hidden">Mới</span>
            </Button>
          </div>
        </motion.div>

        {/* Scrollable messages */}
        <div ref={scrollRef} className="no-scrollbar flex flex-1 flex-col overflow-y-auto pb-2">
          {isEmpty ? (
            <EmptyHero onPick={sendMessage} fileCount={contextFiles.length} prompts={suggestedPrompts} />
          ) : (
            <div className="flex flex-col gap-5 pb-4">
              <AnimatePresence initial={false} mode="popLayout">
                {messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    userInitials={user?.initials ?? ''}
                    userTone={user?.tone ?? 'indigo'}
                  />
                ))}
              </AnimatePresence>

              <AnimatePresence>
                {typing && (
                  <motion.div
                    key="typing"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={spring}
                    className="flex items-end gap-3"
                  >
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-gradient-brand shadow-glow">
                      <Bot className="h-4.5 w-4.5 text-white" />
                    </div>
                    <div className="glass flex items-center gap-2.5 rounded-3xl rounded-tl-md px-4 py-3.5">
                      <TypingDots />
                      <span className="text-xs text-slate-500">đang soạn câu trả lời…</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring}
          className="sticky bottom-0 z-10 mt-2 pt-2"
        >
          <div className="glass-strong flex items-end gap-2 rounded-3xl p-2 shadow-card">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Hỏi mình bất cứ điều gì về tài liệu của bạn… 💬"
              className="no-scrollbar max-h-32 min-h-[2.75rem] flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
            <div className="flex items-center gap-2 pb-0.5 pr-0.5">
              <span className="hidden items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-400 sm:flex">
                <CornerDownLeft className="h-3 w-3" /> gửi
              </span>
              <Button
                type="submit"
                size="icon"
                disabled={!draft.trim() || typing}
                aria-label="Gửi tin nhắn"
                className="shrink-0"
              >
                <Send className="h-4.5 w-4.5" />
              </Button>
            </div>
          </div>
          <p className="mt-2 px-1 text-center text-[10px] text-slate-400">
            CloudMind AI có thể sai sót — luôn kiểm chứng với nguồn được trích dẫn nha ✨
          </p>
        </motion.form>
      </div>

      {/* Context panel */}
      <ContextPanel files={contextFiles} />
    </div>
  )
}