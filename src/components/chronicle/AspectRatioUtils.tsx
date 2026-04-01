/* eslint-disable react-refresh/only-export-components */
import React from 'react';

export const STANDARD_RATIOS = [
  { w: 1, h: 1, label: '1:1' },
  { w: 9, h: 16, label: '9:16' },
  { w: 2, h: 3, label: '2:3' },
  { w: 3, h: 4, label: '3:4' },
  { w: 4, h: 5, label: '4:5' },
  { w: 3, h: 5, label: '3:5' },
  { w: 7, h: 9, label: '7:9' },
  { w: 16, h: 9, label: '16:9' },
  { w: 5, h: 3, label: '5:3' },
  { w: 3, h: 2, label: '3:2' },
  { w: 4, h: 3, label: '4:3' },
  { w: 5, h: 4, label: '5:4' },
  { w: 9, h: 7, label: '9:7' },
];

export function getClosestRatio(w: number, h: number) {
  const actual = w / h;
  let best = STANDARD_RATIOS[0];
  let bestDiff = Infinity;
  for (const r of STANDARD_RATIOS) {
    const diff = Math.abs(actual - r.w / r.h);
    if (diff < bestDiff) { bestDiff = diff; best = r; }
  }
  const orientation: 'portrait' | 'landscape' | 'square' =
    best.w < best.h ? 'portrait' : best.w > best.h ? 'landscape' : 'square';
  return { label: best.label, orientation };
}

export const AspectRatioIcon: React.FC<{ orientation: 'portrait' | 'landscape' | 'square' }> = ({ orientation }) => {
  let rw: number, rh: number;
  if (orientation === 'portrait') { rw = 5; rh = 9; }
  else if (orientation === 'landscape') { rw = 9; rh = 5; }
  else { rw = 8; rh = 8; }
  const x = (12 - rw) / 2;
  const y = (12 - rh) / 2;
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-zinc-400 flex-shrink-0">
      <rect x={x} y={y} width={rw} height={rh} rx="1.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
};
