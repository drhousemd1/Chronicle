import React from 'react';

interface ArcConnectorsProps {
  type: 'split' | 'merge';
}

export const ArcConnectors: React.FC<ArcConnectorsProps> = ({ type }) => {
  return (
    <div style={{ height: type === 'split' ? '88px' : '48px', width: '100%' }}>
      <svg
        width="100%"
        height={type === 'split' ? '88' : '48'}
        viewBox={type === 'split' ? '0 0 100 88' : '0 0 100 48'}
        preserveAspectRatio="none"
        style={{ display: 'block' }}
      >
        {type === 'split' ? (
          <>
            <defs>
              <linearGradient id="fade-down" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(232,238,248,0)" />
                <stop offset="100%" stopColor="rgba(232,238,248,0.82)" />
              </linearGradient>
            </defs>
            {/* Fading vertical stem from top to horizontal bar */}
            <line x1="50" y1="0" x2="50" y2="64" stroke="url(#fade-down)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            {/* Horizontal bar */}
            <line x1="25" y1="64" x2="75" y2="64" stroke="rgba(232,238,248,0.82)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            {/* Left drop */}
            <line x1="25" y1="64" x2="25" y2="88" stroke="rgba(232,238,248,0.82)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            {/* Right drop */}
            <line x1="75" y1="64" x2="75" y2="88" stroke="rgba(232,238,248,0.82)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
          </>
        ) : (
          <>
            {/* Left rise */}
            <line x1="25" y1="0" x2="25" y2="24" stroke="rgba(232,238,248,0.82)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            {/* Right rise */}
            <line x1="75" y1="0" x2="75" y2="24" stroke="rgba(232,238,248,0.82)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            {/* Horizontal bar */}
            <line x1="25" y1="24" x2="75" y2="24" stroke="rgba(232,238,248,0.82)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            {/* Vertical stem down from center */}
            <line x1="50" y1="24" x2="50" y2="48" stroke="rgba(232,238,248,0.82)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
          </>
        )}
      </svg>
    </div>
  );
};
