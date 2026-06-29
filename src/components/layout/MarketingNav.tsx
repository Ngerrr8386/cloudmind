import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { Logo, Button } from '@/components/ui'
import { cn } from '@/lib/utils'

const links = [
  { label: 'Tính năng', href: '#features' },
  { label: 'Cách hoạt động', href: '#how' },
  { label: 'Bảng giá', href: '/pricing' },
  { label: 'Đánh giá', href: '#testimonials' },
]

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

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
              <a key={l.label} href={l.href} className="rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-900 hover:bg-slate-100">
                {l.label}
              </a>
            ) : (
              <Link key={l.label} to={l.href} className="rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-900 hover:bg-slate-100">
                {l.label}
              </Link>
            ),
          )}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Đăng nhập</Button>
          <Button size="sm" onClick={() => navigate('/app')}>Dùng thử miễn phí</Button>
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
              <a key={l.label} href={l.href} onClick={() => setOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100">
                {l.label}
              </a>
            ))}
            <div className="mt-2 flex gap-2 px-1">
              <Button variant="glass" size="sm" className="flex-1" onClick={() => navigate('/login')}>Đăng nhập</Button>
              <Button size="sm" className="flex-1" onClick={() => navigate('/app')}>Dùng thử</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
