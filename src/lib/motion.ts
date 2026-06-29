import type { Variants, Transition } from 'framer-motion'

/** Springy, GenZ-feel transition. */
export const spring: Transition = {
  type: 'spring',
  stiffness: 260,
  damping: 22,
  mass: 0.9,
}

export const softSpring: Transition = {
  type: 'spring',
  stiffness: 140,
  damping: 18,
}

/** Container that staggers its children in. */
export const staggerContainer = (stagger = 0.08, delay = 0): Variants => ({
  hidden: {},
  show: {
    transition: { staggerChildren: stagger, delayChildren: delay },
  },
})

/** Fade + rise. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: spring },
}

export const fadeUpLg: Variants = {
  hidden: { opacity: 0, y: 48 },
  show: { opacity: 1, y: 0, transition: { ...spring, stiffness: 120 } },
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.5 } },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  show: { opacity: 1, scale: 1, transition: spring },
}

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -32 },
  show: { opacity: 1, x: 0, transition: spring },
}

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 32 },
  show: { opacity: 1, x: 0, transition: spring },
}

/** Pop with a tiny overshoot — great for badges/chips. */
export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.5 },
  show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 400, damping: 15 } },
}

/** Standard page transition for routed views. */
export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
}

/** Hover lift props for interactive cards. */
export const hoverLift = {
  whileHover: { y: -6, transition: softSpring },
  whileTap: { scale: 0.98 },
}
