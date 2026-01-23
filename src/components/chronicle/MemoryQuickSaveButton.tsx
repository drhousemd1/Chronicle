import React, { useState } from 'react';
import { TimeOfDay } from '@/types';
import { Brain, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MemoryQuickSaveButtonProps {
  messageId: string;
  messageText: string;
  day: number | undefined;
  timeOfDay: TimeOfDay | undefined;
  characterNames: string[];
  modelId: string;
  onSaveMemory: (content: string, day: number | null, timeOfDay: TimeOfDay | null, sourceMessageId: string) => Promise<void>;
  hasExistingMemory?: boolean;
}

export const MemoryQuickSaveButton: React.FC<MemoryQuickSaveButtonProps> = ({
  messageId,
  messageText,
  day,
  timeOfDay,
  characterNames,
  modelId,
  onSaveMemory,
  hasExistingMemory = false,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClick = async () => {
    if (isProcessing || hasExistingMemory) return;
    
    setIsProcessing(true);
    try {
      // Extract events via edge function
      const { data, error } = await supabase.functions.invoke('extract-memory-events', {
        body: {
          messageText,
          characterNames,
          modelId
        }
      });

      if (error) {
        console.error('Failed to extract events:', error);
        setIsProcessing(false);
        return;
      }

      const events = data?.extractedEvents || [];
      
      // Save all extracted events silently
      for (const content of events) {
        await onSaveMemory(content, day ?? null, timeOfDay ?? null, messageId);
      }
    } catch (error) {
      console.error('Memory save failed:', error);
      // Silent failure - no toast to maintain immersion
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isProcessing}
      className={`p-1.5 rounded-lg transition-colors ${
        hasExistingMemory 
          ? 'text-purple-400 hover:bg-purple-500/20 cursor-default' 
          : 'text-slate-500 hover:text-purple-400 hover:bg-white/10'
      }`}
      title={hasExistingMemory ? 'Memory saved' : 'Save as memory'}
    >
      {isProcessing ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Brain className={`w-4 h-4 ${hasExistingMemory ? 'fill-purple-400/30' : ''}`} />
      )}
    </button>
  );
};

export default MemoryQuickSaveButton;
