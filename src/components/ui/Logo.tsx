import { cn } from '@/lib/utils'

export function Logo({ className, showText = true, size = 'md' }: { className?: string; showText?: boolean; size?: 'sm' | 'md' | 'lg' }) {
  const dim = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-12 w-12' : 'h-10 w-10'
  const text = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl'
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className={cn('relative grid place-items-center rounded-2xl bg-gradient-brand shadow-glow', dim)}>
        <svg viewBox="0 0 64 64" className="relative h-[58%] w-[58%]" fill="none">
          <path d="M20 38a9 9 0 0 1 1-17.9 12 12 0 0 1 22.6 3.1A8 8 0 0 1 44 38H20Z" fill="white" fillOpacity="0.97" />
          <circle cx="26" cy="44" r="2.4" fill="white" />
          <circle cx="38" cy="44" r="2.4" fill="white" />
          <circle cx="32" cy="48.5" r="2.4" fill="white" />
        </svg>
      </div>
      {showText && (
        <span className={cn('font-extrabold tracking-tight text-slate-900', text)}>
          Cloud<span className="text-gradient">Mind</span>
        </span>
      )}
    </div>
  )
}
