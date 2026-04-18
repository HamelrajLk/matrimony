'use client';

import React from 'react';
import { useInView } from '@/hooks/useInView';
import type { AnimDirection } from '@/types/landing';

interface AnimInProps {
  children: React.ReactNode;
  delay?: number;
  direction?: AnimDirection;
}

const transforms: Record<AnimDirection, string> = {
  up: 'translateY(48px)',
  left: 'translateX(-40px)',
  right: 'translateX(40px)',
  scale: 'scale(0.88) translateY(20px)',
};

export default function AnimIn({ children, delay = 0, direction = 'up' }: AnimInProps) {
  const [ref, visible] = useInView();

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : transforms[direction],
        transition: `opacity 0.75s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.75s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
