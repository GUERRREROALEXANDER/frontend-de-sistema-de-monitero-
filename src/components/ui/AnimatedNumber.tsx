import { useEffect } from 'react';
import { animate, motion, useMotionValue, useTransform } from 'motion/react';

interface AnimatedNumberProps {
  value: number;
  format: (value: number) => string;
  className?: string;
}

/** Counts smoothly from the previous value to the new one. */
export function AnimatedNumber({ value, format, className }: AnimatedNumberProps) {
  const motionValue = useMotionValue(value);
  const text = useTransform(motionValue, (v) => format(v));

  useEffect(() => {
    const controls = animate(motionValue, value, { duration: 0.8, ease: [0.22, 1, 0.36, 1] });
    return () => controls.stop();
  }, [motionValue, value]);

  return <motion.span className={className}>{text}</motion.span>;
}
