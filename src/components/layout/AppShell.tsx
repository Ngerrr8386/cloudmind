import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { UploadModal } from '@/components/shared/UploadModal'
import { AnimatedBackground } from '@/components/ui'
import { pageTransition } from '@/lib/motion'

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [dataNonce, setDataNonce] = useState(0)
  const refreshData = () => setDataNonce((n) => n + 1)
  const location = useLocation()

  return (
    <div className="relative flex h-screen overflow-hidden bg-surface-0">
      <AnimatedBackground variant="subtle" className="opacity-60" />

      {/* Desktop sidebar */}
      <div className="relative z-20 hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              className="fixed inset-y-0 left-0 z-50 lg:hidden"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            >
              <Sidebar onNavigate={() => setMobileOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <Topbar onMenu={() => setMobileOpen(true)} onUpload={() => setUploadOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          {/* Keyed by pathname so each route remounts and plays its entrance.
              NOTE: do not wrap in <AnimatePresence mode="wait"> around <Outlet> —
              the exit→enter handoff gets stuck and leaves the new page at opacity 0. */}
          <motion.div
            key={location.pathname}
            variants={pageTransition}
            initial="hidden"
            animate="show"
            className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8"
          >
            <Outlet context={{ openUpload: () => setUploadOpen(true), dataNonce, refreshData }} />
          </motion.div>
        </main>
      </div>

      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} onUploaded={refreshData} />

      {/* Floating upload button (mobile only — hidden on the chat route,
          whose sticky composer already occupies the bottom-right corner) */}
      {location.pathname !== '/app/chat' && (
        <button
          onClick={() => setUploadOpen(true)}
          className="fixed bottom-6 right-6 z-30 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-brand shadow-glow sm:hidden"
          aria-label="Tải lên"
        >
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
        </button>
      )}
    </div>
  )
}
