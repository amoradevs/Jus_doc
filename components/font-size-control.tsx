'use client';
import { useState, useEffect } from 'react';

const SIZES = [13, 15, 16, 18, 20];
const DEFAULT_IDX = 2;
const KEY = 'jusdoc-font-size';

export function FontSizeControl() {
  const [idx, setIdx] = useState(DEFAULT_IDX);

  useEffect(() => {
    const saved = localStorage.getItem(KEY);
    if (saved !== null) {
      const i = parseInt(saved);
      setIdx(i);
      document.documentElement.style.fontSize = `${SIZES[i]}px`;
    }
  }, []);

  const change = (dir: 1 | -1) => {
    const next = Math.max(0, Math.min(SIZES.length - 1, idx + dir));
    if (next === idx) return;
    setIdx(next);
    document.documentElement.style.fontSize = `${SIZES[next]}px`;
    localStorage.setItem(KEY, String(next));
  };

  return (
    <div className="flex items-center gap-0.5">
      <button
        onClick={() => change(-1)}
        disabled={idx === 0}
        title="Diminuir texto"
        className="px-1.5 py-1 rounded text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        A−
      </button>
      <button
        onClick={() => change(1)}
        disabled={idx === SIZES.length - 1}
        title="Aumentar texto"
        className="px-1.5 py-1 rounded text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        A+
      </button>
    </div>
  );
}
