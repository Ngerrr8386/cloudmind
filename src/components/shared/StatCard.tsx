import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, type LucideIcon } from 'lucide-react'
import { GlassCard } from '@/components/ui'
import { fadeUp } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { tone as toneClasses, type Tone } from '@/lib/theme'

export function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  tone = 'indigo',
  suffix,
}: {
  icon: LucideIcon
  label: string
  value: string
  trend?: number
  tone?: Tone
  suffix?: string
}) {
  const up = (trend ?? 0) >= 0
  return (
    <motion.div variants={fadeUp}>
      <GlassCard interactive className="p-5">
        <div className="flex items-start justify-between">
          <div className={cn('grid h-11 w-11 place-items-center rounded-2xl', toneClasses(tone).soft)}>
            <Icon className="h-5 w-5" />
          </div>
          {trend !== undefined && (
            <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold', up ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600')}>
              {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(trend)}%
            </span>
          )}
        </div>
        <p className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900">
          {value}
          {suffix && <span className="ml-1 text-base font-semibold text-slate-400">{suffix}</span>}
        </p>
        <p className="mt-1 text-sm text-slate-500">{label}</p>
      </GlassCard>
    </motion.div>
  )
}
