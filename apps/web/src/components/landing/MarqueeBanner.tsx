const marqueeItems = [
  '💍 Matrimony',
  '📸 Photography',
  '🏛️ Wedding Halls',
  '💄 Makeup Artists',
  '🎶 DJ & Music',
  '💐 Florists',
  '🎂 Cake Designers',
  '✦ The Wedding Partners',
  '🇱🇰 Sri Lanka & Beyond',
  '🌍 Worldwide',
];

export default function MarqueeBanner() {
  return (
    <div
      style={{
        background: '#FFFBF7',
        borderTop: '1px solid #F5EDE0',
        borderBottom: '1px solid #F5EDE0',
        padding: '15px 0',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          animation: 'marquee 24s linear infinite',
          whiteSpace: 'nowrap',
          width: '200%',
        }}
      >
        {[0, 1].map((k) => (
          <span
            key={k}
            style={{
              fontFamily: "'Outfit',sans-serif",
              fontSize: '0.84rem',
              fontWeight: 500,
              color: '#B8A898',
              letterSpacing: '0.05em',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            {marqueeItems.map((s) => (
              <span key={s} style={{ marginRight: 52 }}>
                {s}
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}
