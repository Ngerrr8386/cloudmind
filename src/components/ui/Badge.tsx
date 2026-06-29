import { cn } from '@/lib/utils'

type Tone = 'brand' | 'mint' | 'candy' | 'sky' | 'sun' | 'neutral' | 'ai'

const tones: Record<Tone, string> = {
  brand: 'bg-ink-50 text-ink-700 border-ink-200',
  mint: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  candy: 'bg-rose-50 text-rose-600 border-rose-200',
  sky: 'bg-sky-50 text-sky-700 border-sky-200',
  sun: 'bg-amber-50 text-amber-700 border-amber-200',
  neutral: 'bg-slate-100 text-slate-600 border-slate-200',
  ai: 'bg-ink-50 text-ink-700 border-ink-200',
}

export function Badge({
  children,
  tone = 'neutral',
  className,
  dot = false,
}: {
  children: React.ReactNode
  tone?: Tone
  className?: string
  dot?: boolean
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />}
      {children}
    </span>
  )
}
