'use client';

import { useRef, useEffect } from 'react';

interface ParticleCanvasProps {
  count?: number;
  colors?: string[];
}

export default function ParticleCanvas({
  count = 30,
  colors = ['#F4A435', '#E8735A', '#E85AA3', '#7B8FE8', '#4ABEAA'],
}: ParticleCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    let W = (c.width = c.offsetWidth);
    let H = (c.height = c.offsetHeight);

    const shapes = ['♥', '✿', '✦', '❋', '◇', '🌸'];
    const pts = Array.from({ length: count }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.35,
      vy: -Math.random() * 0.45 - 0.15,
      sz: Math.random() * 13 + 7,
      a: Math.random() * 0.3 + 0.05,
      sh: shapes[Math.floor(Math.random() * shapes.length)],
      col: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * Math.PI * 2,
      rs: (Math.random() - 0.5) * 0.012,
    }));

    let raf: number;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      pts.forEach((p) => {
        ctx.save();
        ctx.globalAlpha = p.a;
        ctx.font = `${p.sz}px serif`;
        ctx.fillStyle = p.col;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillText(p.sh, 0, 0);
        ctx.restore();
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.rs;
        if (p.y < -20) { p.y = H + 20; p.x = Math.random() * W; }
        if (p.x < -20) p.x = W + 20;
        if (p.x > W + 20) p.x = -20;
      });
      raf = requestAnimationFrame(draw);
    };

    draw();

    const onResize = () => {
      W = c.width = c.offsetWidth;
      H = c.height = c.offsetHeight;
    };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, [count, colors]);

  return (
    <canvas
      ref={ref}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  );
}
