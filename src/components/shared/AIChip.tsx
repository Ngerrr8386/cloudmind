import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Little animated "AI" pill used to mark AI-powered surfaces. */
export function AIChip({ label = 'AI', className }: { label?: string; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full bg-ink-50 border border-ink-200 px-2 py-0.5 text-[11px] font-bold text-ink-600', className)}>
      <motion.span animate={{ rotate: [0, 18, -12, 0], scale: [1, 1.2, 1] }} transition={{ duration: 2.4, repeat: Infinity }}>
        <Sparkles className="h-3 w-3" />
      </motion.span>
      {label}
    </span>
  )
}

/** Confidence meter shown next to AI suggestions. */
export function ConfidenceMeter({ value, className }: { value: number; className?: string }) {
  const pct = Math.round(value * 100)
  const tone = pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-slate-300'
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
        <motion.div className={cn('h-full rounded-full', tone)} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.9, ease: 'easeOut' }} />
      </div>
      <span className="text-xs font-bold tabular-nums text-slate-500">{pct}%</span>
    </div>
  )
}
