/**
 * Flat "tone" system for the light "tri thức" theme.
 * Replaces the old vivid gradients with calm, single-hue tints so the UI
 * reads as a clean knowledge tool rather than a gradient soup.
 */
export type Tone = 'indigo' | 'violet' | 'blue' | 'emerald' | 'amber' | 'rose' | 'slate'

export interface ToneClasses {
  /** Soft tinted chip: light bg + colored fg (icons, thumbnails, badges). */
  soft: string
  /** Solid accent: filled bg + white fg (active states, key CTAs). */
  solid: string
  /** Just the foreground color. */
  text: string
  /** Subtle border. */
  border: string
  /** Focus/selection ring color. */
  ring: string
  /** Small status dot. */
  dot: string
  /** Raw hex (for charts / inline styles). */
  hex: string
}

export const TONES: Record<Tone, ToneClasses> = {
  indigo: { soft: 'bg-indigo-50 text-indigo-600', solid: 'bg-indigo-600 text-white', text: 'text-indigo-600', border: 'border-indigo-200', ring: 'ring-indigo-200', dot: 'bg-indigo-500', hex: '#4f46e5' },
  violet: { soft: 'bg-violet-50 text-violet-600', solid: 'bg-violet-600 text-white', text: 'text-violet-600', border: 'border-violet-200', ring: 'ring-violet-200', dot: 'bg-violet-500', hex: '#7c3aed' },
  blue: { soft: 'bg-sky-50 text-sky-600', solid: 'bg-sky-600 text-white', text: 'text-sky-600', border: 'border-sky-200', ring: 'ring-sky-200', dot: 'bg-sky-500', hex: '#0284c7' },
  emerald: { soft: 'bg-emerald-50 text-emerald-600', solid: 'bg-emerald-600 text-white', text: 'text-emerald-600', border: 'border-emerald-200', ring: 'ring-emerald-200', dot: 'bg-emerald-500', hex: '#059669' },
  amber: { soft: 'bg-amber-50 text-amber-600', solid: 'bg-amber-500 text-white', text: 'text-amber-600', border: 'border-amber-200', ring: 'ring-amber-200', dot: 'bg-amber-500', hex: '#d97706' },
  rose: { soft: 'bg-rose-50 text-rose-600', solid: 'bg-rose-600 text-white', text: 'text-rose-600', border: 'border-rose-200', ring: 'ring-rose-200', dot: 'bg-rose-500', hex: '#e11d48' },
  slate: { soft: 'bg-slate-100 text-slate-600', solid: 'bg-slate-700 text-white', text: 'text-slate-600', border: 'border-slate-200', ring: 'ring-slate-200', dot: 'bg-slate-400', hex: '#475569' },
}

/** Safe accessor with a sensible fallback. */
export function tone(t: Tone | string | undefined): ToneClasses {
  return TONES[(t as Tone) in TONES ? (t as Tone) : 'indigo']
}

/** Ordered palette for charts / cluster maps. */
export const TONE_ORDER: Tone[] = ['indigo', 'violet', 'blue', 'emerald', 'amber', 'rose']
