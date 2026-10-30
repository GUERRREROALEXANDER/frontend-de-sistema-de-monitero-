import type { Transition, Variants } from 'motion/react';

export const spring: Transition = { type: 'spring', stiffness: 380, damping: 30 };

/** Parent that reveals its children one after another. */
export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

/** Card entrance: rises and scales in with a slight back-out overshoot. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.94 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.42, ease: [0.34, 1.4, 0.64, 1] } },
};

/** Page transition between views. */
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 12, filter: 'blur(4px)' },
  enter: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -8, filter: 'blur(4px)', transition: { duration: 0.18 } },
};
