import { useI18n, type Lang } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const LANGS: { id: Lang; short: string }[] = [
  { id: 'vi', short: 'VI' },
  { id: 'en', short: 'EN' },
]

/** Nút gạt đổi ngôn ngữ dạng segmented (VI | EN). */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { lang, setLang } = useI18n()
  return (
    <div
      role="group"
      aria-label="Language"
      className={cn('inline-flex items-center gap-0.5 rounded-full border border-slate-200 bg-slate-50 p-0.5', className)}
    >
      {LANGS.map((l) => {
        const active = lang === l.id
        return (
          <button
            key={l.id}
            type="button"
            onClick={() => setLang(l.id)}
            aria-pressed={active}
            className={cn(
              'rounded-full px-2.5 py-1 text-xs font-bold transition-colors',
              active ? 'bg-white text-ink-700 shadow-sm' : 'text-slate-400 hover:text-slate-600',
            )}
          >
            {l.short}
          </button>
        )
      })}
    </div>
  )
}
