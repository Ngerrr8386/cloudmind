import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { Logo, Button } from '@/components/ui'
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher'
import { useAuth } from '@/lib/auth'
import { useT, type TranslationKey } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const links: { labelKey: TranslationKey; href: string }[] = [
  { labelKey: 'nav.features', href: '#features' },
  { labelKey: 'nav.how', href: '#how' },
  { labelKey: 'nav.pricing', href: '/pricing' },
  { labelKey: 'nav.testimonials', href: '#testimonials' },
]

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { user } = useAuth()
  const t = useT()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.header
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 24 }}
      className="fixed inset-x-0 top-0 z-50 px-4 pt-3"
    >
      <div
        className={cn(
          'mx-auto flex max-w-6xl items-center justify-between rounded-2xl px-4 py-2.5 transition-all duration-300 md:px-5',
          scrolled ? 'glass-strong shadow-card' : 'bg-transparent',
        )}
      >
        <Link to="/"><Logo /></Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) =>
            l.href.startsWith('#') ? (
              <a key={l.labelKey} href={l.href} className="rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-900 hover:bg-slate-100">
                {t(l.labelKey)}
              </a>
            ) : (
              <Link key={l.labelKey} to={l.href} className="rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-900 hover:bg-slate-100">
                {t(l.labelKey)}
              </Link>
            ),
          )}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <LanguageSwitcher />
          {user ? (
            <Button size="sm" onClick={() => navigate('/app')}>{t('nav.openApp')}</Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>{t('nav.login')}</Button>
              <Button size="sm" onClick={() => navigate('/signup')}>{t('nav.tryFree')}</Button>
            </>
          )}
        </div>

        <button onClick={() => setOpen((v) => !v)} className="grid h-10 w-10 place-items-center rounded-xl text-slate-700 md:hidden">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mx-auto mt-2 max-w-6xl rounded-2xl glass-strong shadow-card p-3 md:hidden"
          >
            {links.map((l) => (
              <a key={l.labelKey} href={l.href} onClick={() => setOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100">
                {t(l.labelKey)}
              </a>
            ))}
            <div className="mt-2 flex items-center gap-2 px-1">
              <LanguageSwitcher />
              {user ? (
                <Button size="sm" className="flex-1" onClick={() => { setOpen(false); navigate('/app') }}>{t('nav.openApp')}</Button>
              ) : (
                <>
                  <Button variant="glass" size="sm" className="flex-1" onClick={() => { setOpen(false); navigate('/login') }}>{t('nav.login')}</Button>
                  <Button size="sm" className="flex-1" onClick={() => { setOpen(false); navigate('/signup') }}>{t('nav.try')}</Button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
