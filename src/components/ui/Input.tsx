import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-11 w-full rounded-2xl bg-white border border-slate-200 px-4 text-sm text-slate-800 placeholder:text-slate-400',
        'ring-focus transition-colors focus:border-ink-400 focus:bg-white',
        className,
      )}
      {...props}
    />
  ),
)
Input.displayName = 'Input'

export function Toggle({ checked, onChange, className }: { checked: boolean; onChange: (v: boolean) => void; className?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-7 w-12 shrink-0 rounded-full transition-colors ring-focus',
        checked ? 'bg-ink-600' : 'bg-slate-200',
        className,
      )}
    >
      <span
        className={cn(
          'absolute top-1 h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-300',
          checked ? 'translate-x-6' : 'translate-x-1',
        )}
      />
    </button>
  )
}
