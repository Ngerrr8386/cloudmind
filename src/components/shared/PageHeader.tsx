import { motion } from 'framer-motion'
import { fadeUp, staggerContainer } from '@/lib/motion'

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: React.ReactNode
  title: React.ReactNode
  subtitle?: React.ReactNode
  actions?: React.ReactNode
}) {
  return (
    <motion.div
      variants={staggerContainer(0.06)}
      initial="hidden"
      animate="show"
      className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
    >
      <div>
        {eyebrow && <motion.div variants={fadeUp} className="mb-2">{eyebrow}</motion.div>}
        <motion.h1 variants={fadeUp} className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
          {title}
        </motion.h1>
        {subtitle && (
          <motion.p variants={fadeUp} className="mt-1.5 max-w-2xl text-sm text-slate-500">
            {subtitle}
          </motion.p>
        )}
      </div>
      {actions && <motion.div variants={fadeUp} className="flex shrink-0 items-center gap-2">{actions}</motion.div>}
    </motion.div>
  )
}
