const petals = [
  { l: '5%', d: 0, dur: 7 },
  { l: '14%', d: 1.5, dur: 9 },
  { l: '27%', d: 3, dur: 6 },
  { l: '40%', d: 0.8, dur: 8 },
  { l: '55%', d: 2.2, dur: 7.5 },
  { l: '68%', d: 4, dur: 6.5 },
  { l: '80%', d: 1, dur: 9 },
  { l: '92%', d: 2.8, dur: 7 },
];

const petalEmojis = ['🌸', '🌺', '✿', '🌼'];

export default function PetalRain() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 2,
      }}
    >
      {petals.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: p.l,
            top: '-30px',
            fontSize: i % 3 === 0 ? '1.3rem' : '0.9rem',
            animation: `petalFall ${p.dur}s linear ${p.d}s infinite`,
            opacity: 0.65,
          }}
        >
          {petalEmojis[i % 4]}
        </div>
      ))}
    </div>
  );
}
