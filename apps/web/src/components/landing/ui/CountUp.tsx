'use client';

import { useState, useRef, useEffect } from 'react';
import { useInView } from '@/hooks/useInView';

interface CountUpProps {
  target: number;
  suffix?: string;
}

export default function CountUp({ target, suffix = '' }: CountUpProps) {
  const [v, setV] = useState(0);
  const [ref, vis] = useInView(0.5);
  const done = useRef(false);

  useEffect(() => {
    if (!vis || done.current) return;
    done.current = true;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / 1800, 1);
      const ease = 1 - Math.pow(1 - t, 4);
      setV(Math.floor(ease * target));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [vis, target]);

  return (
    <span ref={ref}>
      {v.toLocaleString()}{suffix}
    </span>
  );
}
