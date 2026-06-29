import { cn } from '@/lib/utils'
import { tone as toneClasses, type Tone } from '@/lib/theme'

export function Avatar({
  initials,
  tone = 'indigo',
  size = 'md',
  className,
  ring = false,
}: {
  initials: string
  tone?: Tone
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
  ring?: boolean
}) {
  const dim = {
    xs: 'h-7 w-7 text-[10px]',
    sm: 'h-9 w-9 text-xs',
    md: 'h-11 w-11 text-sm',
    lg: 'h-14 w-14 text-base',
  }[size]
  return (
    <div
      className={cn(
        'grid place-items-center rounded-full font-bold shadow-soft',
        toneClasses(tone).solid,
        dim,
        ring && 'ring-2 ring-white ring-offset-2 ring-offset-slate-100',
        className,
      )}
    >
      {initials}
    </div>
  )
}
