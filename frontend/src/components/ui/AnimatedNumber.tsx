'use client';

import { useEffect, useRef } from 'react';
import { motion, useSpring, useTransform, useMotionValue } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  formatter?: (value: number) => string;
}

export function AnimatedNumber({
  value,
  duration = 0.6,
  decimals = 2,
  prefix = '',
  suffix = '',
  className,
  formatter,
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { damping: 25, stiffness: 120 });
  const rounded = useTransform(spring, (v) => {
    if (formatter) return formatter(v);
    return `${prefix}${v.toFixed(decimals)}${suffix}`;
  });

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  return (
    <motion.span ref={ref} className={cn('tabular-nums', className)}>
      {rounded}
    </motion.span>
  );
}
