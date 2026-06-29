import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLMotionProps<'div'> {
  interactive?: boolean
  glow?: boolean
}

/** White card — the workhorse surface of the light theme. */
export function GlassCard({ className, interactive, glow, children, ...props }: CardProps) {
  return (
    <motion.div
      whileHover={interactive ? { y: -4 } : undefined}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className={cn(
        'relative rounded-3xl bg-white border border-slate-200/80 shadow-card',
        interactive && 'cursor-pointer transition-colors hover:border-slate-300 hover:shadow-glow',
        glow && 'shadow-glow',
        className,
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
}

/** Card with a subtle gradient border accent. */
export function GradientBorderCard({ className, children, gradient = 'from-ink-500 via-grape-500 to-sky2-500' }: { className?: string; children: React.ReactNode; gradient?: string }) {
  return (
    <div className={cn('relative rounded-3xl p-[1.5px] bg-gradient-to-br', gradient, className)}>
      <div className="h-full w-full rounded-[calc(1.5rem-1.5px)] bg-white">{children}</div>
    </div>
  )
}
