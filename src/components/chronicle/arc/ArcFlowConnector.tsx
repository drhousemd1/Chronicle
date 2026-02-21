import React from 'react';

interface ArcFlowConnectorProps {
  containerRef: React.RefObject<HTMLDivElement>;
  sourceStepId: string;
  targetStepId: string;
}

export const ArcFlowConnector: React.FC<ArcFlowConnectorProps> = ({
  containerRef,
  sourceStepId,
  targetStepId,
}) => {
  const [path, setPath] = React.useState<string>('');
  const [size, setSize] = React.useState({ w: 0, h: 0 });

  const recalc = React.useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const sourceEl = container.querySelector(`[data-step-id="${sourceStepId}"]`);
    const targetEl = container.querySelector(`[data-step-id="${targetStepId}"]`);
    if (!sourceEl || !targetEl) return;

    const cRect = container.getBoundingClientRect();
    const sRect = sourceEl.getBoundingClientRect();
    const tRect = targetEl.getBoundingClientRect();

    // Determine if source is on the left or right
    const sCenterX = sRect.left + sRect.width / 2 - cRect.left;
    const tCenterX = tRect.left + tRect.width / 2 - cRect.left;
    const sourceIsLeft = sCenterX < tCenterX;

    // Source edge: right edge if source is left, left edge if source is right
    const sx = sourceIsLeft ? sRect.right - cRect.left : sRect.left - cRect.left;
    const sy = sRect.top + sRect.height / 2 - cRect.top;

    // Target edge: left edge if target is right, right edge if target is left
    const tx = sourceIsLeft ? tRect.left - cRect.left : tRect.right - cRect.left;
    const ty = tRect.top + tRect.height / 2 - cRect.top;

    // Bezier control points for a smooth curve
    const midX = (sx + tx) / 2;
    const d = `M ${sx} ${sy} C ${midX} ${sy}, ${midX} ${ty}, ${tx} ${ty}`;

    setPath(d);
    setSize({ w: cRect.width, h: cRect.height });
  }, [containerRef, sourceStepId, targetStepId]);

  React.useEffect(() => {
    recalc();

    const container = containerRef.current;
    if (!container) return;

    const ro = new ResizeObserver(() => recalc());
    ro.observe(container);

    // Also recalc on window resize
    window.addEventListener('resize', recalc);

    // MutationObserver to catch DOM changes (steps added/removed)
    const mo = new MutationObserver(() => requestAnimationFrame(recalc));
    mo.observe(container, { childList: true, subtree: true });

    return () => {
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener('resize', recalc);
    };
  }, [recalc]);

  if (!path || size.w === 0) return null;

  return (
    <svg
      className="absolute inset-0 pointer-events-none z-10"
      width={size.w}
      height={size.h}
      style={{ overflow: 'visible' }}
    >
      <path
        d={path}
        fill="none"
        stroke="rgba(161,178,209,0.6)"
        strokeWidth="2"
        strokeDasharray="6 4"
      />
    </svg>
  );
};
