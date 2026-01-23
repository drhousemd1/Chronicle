import React, { useState, useEffect } from 'react';
import { TimeOfDay } from '@/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Brain, 
  Loader2, 
  Calendar,
  Sunrise,
  Sun,
  Sunset,
  Moon,
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface MemoryQuickSavePopoverProps {
  messageId: string;
  messageText: string;
  day: number | undefined;
  timeOfDay: TimeOfDay | undefined;
  characterNames: string[];
  modelId: string;
  onSaveMemory: (content: string, day: number | null, timeOfDay: TimeOfDay | null, sourceMessageId: string) => Promise<void>;
  hasExistingMemory?: boolean;
}

const TimeIcon: React.FC<{ time: TimeOfDay | undefined }> = ({ time }) => {
  if (!time) return null;
  switch (time) {
    case 'sunrise': return <Sunrise className="w-3.5 h-3.5" />;
    case 'day': return <Sun className="w-3.5 h-3.5" />;
    case 'sunset': return <Sunset className="w-3.5 h-3.5" />;
    case 'night': return <Moon className="w-3.5 h-3.5" />;
  }
};

export const MemoryQuickSavePopover: React.FC<MemoryQuickSavePopoverProps> = ({
  messageId,
  messageText,
  day,
  timeOfDay,
  characterNames,
  modelId,
  onSaveMemory,
  hasExistingMemory = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedEvents, setExtractedEvents] = useState<string[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<Set<number>>(new Set());
  const [customText, setCustomText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [extractionFailed, setExtractionFailed] = useState(false);

  const handleOpen = async (open: boolean) => {
    setIsOpen(open);
    if (open && extractedEvents.length === 0 && !extractionFailed) {
      // Extract events when popover opens
      await extractEvents();
    }
  };

  const extractEvents = async () => {
    setIsExtracting(true);
    setExtractionFailed(false);
    
    try {
      const { data, error } = await supabase.functions.invoke('extract-memory-events', {
        body: {
          messageText,
          characterNames,
          modelId
        }
      });

      if (error) throw error;

      const events = data?.extractedEvents || [];
      setExtractedEvents(events);
      
      // Pre-select all extracted events
      if (events.length > 0) {
        setSelectedEvents(new Set(events.map((_: string, i: number) => i)));
      }
    } catch (error) {
      console.error('Failed to extract events:', error);
      setExtractionFailed(true);
      toast.error('Could not extract events. You can still add a custom memory.');
    } finally {
      setIsExtracting(false);
    }
  };

  const toggleEvent = (index: number) => {
    const newSelected = new Set(selectedEvents);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedEvents(newSelected);
  };

  const handleSave = async () => {
    // Collect all content to save
    const contentsToSave: string[] = [];
    
    // Add selected extracted events
    selectedEvents.forEach(index => {
      if (extractedEvents[index]) {
        contentsToSave.push(extractedEvents[index]);
      }
    });
    
    // Add custom text if provided
    if (customText.trim()) {
      contentsToSave.push(customText.trim());
    }

    if (contentsToSave.length === 0) {
      toast.error('Please select or write at least one memory');
      return;
    }

    setIsSaving(true);
    try {
      // Save each memory
      for (const content of contentsToSave) {
        await onSaveMemory(content, day ?? null, timeOfDay ?? null, messageId);
      }
      
      toast.success(`Saved ${contentsToSave.length} ${contentsToSave.length === 1 ? 'memory' : 'memories'}`);
      setIsOpen(false);
      
      // Reset state
      setExtractedEvents([]);
      setSelectedEvents(new Set());
      setCustomText('');
    } catch (error) {
      console.error('Failed to save memory:', error);
      toast.error('Failed to save memory');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset state when closing
  useEffect(() => {
    if (!isOpen) {
      setExtractedEvents([]);
      setSelectedEvents(new Set());
      setCustomText('');
      setExtractionFailed(false);
    }
  }, [isOpen]);

  return (
    <Popover open={isOpen} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <button
          className={`p-1.5 rounded-lg transition-colors ${
            hasExistingMemory 
              ? 'text-purple-400 hover:bg-purple-500/20' 
              : 'text-slate-500 hover:text-purple-400 hover:bg-white/10'
          }`}
          title={hasExistingMemory ? 'Has saved memory' : 'Save as memory'}
        >
          {isExtracting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Brain className={`w-4 h-4 ${hasExistingMemory ? 'fill-purple-400/30' : ''}`} />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 bg-slate-900 border-slate-700 text-white p-4"
        side="top"
        align="end"
      >
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-400" />
              Save as Memory
            </h4>
            {(day || timeOfDay) && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                {day && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Day {day}
                  </span>
                )}
                {timeOfDay && <TimeIcon time={timeOfDay} />}
              </div>
            )}
          </div>

          {/* Loading state */}
          {isExtracting && (
            <div className="flex items-center justify-center py-6 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              <span className="text-sm">Extracting key events...</span>
            </div>
          )}

          {/* Extracted events */}
          {!isExtracting && extractedEvents.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-slate-400">Extracted events:</p>
              <div className="space-y-1.5">
                {extractedEvents.map((event, index) => (
                  <label
                    key={index}
                    className="flex items-start gap-2 p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={selectedEvents.has(index)}
                      onCheckedChange={() => toggleEvent(index)}
                      className="mt-0.5 border-slate-600 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                    />
                    <span className="text-sm text-slate-200 leading-relaxed">{event}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* No events found or extraction failed */}
          {!isExtracting && extractedEvents.length === 0 && (
            <p className="text-xs text-slate-500 py-2">
              {extractionFailed 
                ? 'Could not extract events automatically.' 
                : 'No key events detected in this message.'}
            </p>
          )}

          {/* Custom text input */}
          {!isExtracting && (
            <div className="space-y-1.5">
              <p className="text-xs text-slate-400">Or write your own:</p>
              <Textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Enter a custom memory..."
                className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 min-h-[60px] resize-none text-sm"
                maxLength={300}
              />
              {customText.length > 0 && (
                <p className="text-xs text-slate-500 text-right">{customText.length}/300</p>
              )}
            </div>
          )}

          {/* Actions */}
          {!isExtracting && (
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving || (selectedEvents.size === 0 && !customText.trim())}
                className="bg-purple-600 hover:bg-purple-500 text-white"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-3 h-3 mr-1" />
                    Save
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default MemoryQuickSavePopover;
