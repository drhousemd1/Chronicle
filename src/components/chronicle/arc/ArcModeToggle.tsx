import React from 'react';
import { ArcMode } from '@/types';

interface ArcModeToggleProps {
  mode: ArcMode;
  onChange: (mode: ArcMode) => void;
}

export const ArcModeToggle: React.FC<ArcModeToggleProps> = ({ mode, onChange }) => {
  return (
    <div
      className="flex items-center overflow-hidden"
      style={{
        borderRadius: '999px',
        border: '1px solid rgba(123,155,203,0.44)',
        background: 'rgba(21,25,35,0.86)',
      }}
    >
      <button
        type="button"
        onClick={() => onChange('simple')}
        style={{
          padding: '6px 14px',
          fontSize: '10px',
          letterSpacing: '0.14em',
          fontWeight: 700,
          textTransform: 'uppercase',
          borderRadius: '999px',
          transition: 'all 0.15s',
          background: mode === 'simple' ? 'rgba(99,135,194,0.58)' : 'transparent',
          color: mode === 'simple' ? '#edf3ff' : 'rgba(198,213,238,0.82)',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        Simple
      </button>
      <button
        type="button"
        onClick={() => onChange('advanced')}
        style={{
          padding: '6px 14px',
          fontSize: '10px',
          letterSpacing: '0.14em',
          fontWeight: 700,
          textTransform: 'uppercase',
          borderRadius: '999px',
          transition: 'all 0.15s',
          background: mode === 'advanced' ? 'rgba(99,135,194,0.58)' : 'transparent',
          color: mode === 'advanced' ? '#edf3ff' : 'rgba(198,213,238,0.82)',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        Advanced
      </button>
    </div>
  );
};
