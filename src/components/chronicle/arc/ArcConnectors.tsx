import React from 'react';

interface ArcConnectorsProps {
  type: 'split' | 'merge';
}

export const ArcConnectors: React.FC<ArcConnectorsProps> = ({ type }) => {
  return (
    <div className="flex justify-center" style={{ height: '66px' }}>
      <svg width="100%" height="66" viewBox="0 0 400 66" preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id={`glow-${type}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="0.8" result="blur" />
            <feFlood floodColor="#FFFFFF" floodOpacity="0.28" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {type === 'split' ? (
          <g filter={`url(#glow-${type})`}>
            <path
              d="M200,0 L200,22 L100,56"
              fill="none"
              stroke="rgba(232,238,248,0.82)"
              strokeWidth="1.8"
            />
            <path
              d="M200,0 L200,22 L300,56"
              fill="none"
              stroke="rgba(232,238,248,0.82)"
              strokeWidth="1.8"
            />
          </g>
        ) : (
          <g filter={`url(#glow-${type})`}>
            <path
              d="M100,10 L200,44 L200,66"
              fill="none"
              stroke="rgba(232,238,248,0.82)"
              strokeWidth="1.8"
            />
            <path
              d="M300,10 L200,44 L200,66"
              fill="none"
              stroke="rgba(232,238,248,0.82)"
              strokeWidth="1.8"
            />
          </g>
        )}
      </svg>
    </div>
  );
};
