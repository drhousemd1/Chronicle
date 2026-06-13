import React from 'react';

export type TypingIndicatorBubbleProps = {
  offsetBubbles: boolean;
  bubblesTransparent: boolean;
  chatBubbleColor: string;
};

export const TypingIndicatorBubble: React.FC<TypingIndicatorBubbleProps> = ({
  offsetBubbles,
  bubblesTransparent,
  chatBubbleColor,
}) => (
  <div
    className={`w-full animate-in fade-in slide-in-from-bottom-3 duration-300 ${
      offsetBubbles ? 'max-w-3xl mr-auto' : 'max-w-4xl mx-auto'
    }`}
    role="status"
    aria-live="polite"
    aria-label="AI character is writing"
  >
    <div
      className={`inline-flex items-center gap-1.5 rounded-2xl px-5 py-4 shadow-2xl ${
        bubblesTransparent ? 'bg-black/50' : ''
      }`}
      style={!bubblesTransparent ? { backgroundColor: chatBubbleColor } : undefined}
    >
      {[0, 1, 2].map((dot) => (
        <span
          key={dot}
          className="h-2.5 w-2.5 rounded-full bg-slate-300/80 shadow-[0_0_10px_rgba(203,213,225,0.35)] animate-bounce"
          style={{ animationDelay: `${dot * 140}ms` }}
        />
      ))}
      <span className="sr-only">AI character is writing</span>
    </div>
  </div>
);
