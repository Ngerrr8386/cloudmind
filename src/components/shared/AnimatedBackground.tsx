import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

/**
 * Calm light backdrop — a faint grid plus very soft tinted washes.
 * Intentionally low-key to keep the "tri thức" UI clean and uncluttered.
 */
export function AnimatedBackground({ className, variant = 'default' }: { className?: string; variant?: 'default' | 'subtle' }) {
  const blobs = [
    { c: 'bg-ink-200/40', x: '-8%', y: '-6%', s: 'h-[30rem] w-[30rem]', d: 0 },
    { c: 'bg-grape-200/30', x: '72%', y: '-10%', s: 'h-[26rem] w-[26rem]', d: 2 },
    { c: 'bg-sky2-200/30', x: '40%', y: '60%', s: 'h-[28rem] w-[28rem]', d: 4 },
  ]
  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      {variant === 'default' && (
        <div
          className="absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 30%, transparent 75%)',
          }}
        />
      )}
      {blobs.map((b, i) => (
        <motion.div
          key={i}
          className={cn('absolute rounded-full blur-[110px]', b.c, b.s)}
          style={{ left: b.x, top: b.y }}
          animate={{ x: [0, 24, -16, 0], y: [0, -18, 12, 0], scale: [1, 1.06, 0.97, 1] }}
          transition={{ duration: 22 + b.d * 2, repeat: Infinity, ease: 'easeInOut', delay: b.d }}
        />
      ))}
    </div>
  )
}
