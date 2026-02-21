import React from 'react';

interface ArcConnectorsProps {
  type: 'split' | 'merge';
}

export const ArcConnectors: React.FC<ArcConnectorsProps> = ({ type }) => {
  return (
    <div className="flex justify-center py-1">
      <svg width="200" height="24" viewBox="0 0 200 24" className="text-zinc-600">
        {type === 'split' ? (
          <>
            <line x1="100" y1="0" x2="100" y2="8" stroke="currentColor" strokeWidth="1.5" />
            <line x1="100" y1="8" x2="30" y2="20" stroke="currentColor" strokeWidth="1.5" />
            <line x1="100" y1="8" x2="170" y2="20" stroke="currentColor" strokeWidth="1.5" />
          </>
        ) : (
          <>
            <line x1="30" y1="4" x2="100" y2="16" stroke="currentColor" strokeWidth="1.5" />
            <line x1="170" y1="4" x2="100" y2="16" stroke="currentColor" strokeWidth="1.5" />
            <line x1="100" y1="16" x2="100" y2="24" stroke="currentColor" strokeWidth="1.5" />
          </>
        )}
      </svg>
    </div>
  );
};
