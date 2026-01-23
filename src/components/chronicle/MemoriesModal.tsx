import React, { useState } from 'react';
import { Memory, TimeOfDay } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { 
  Brain, 
  Plus, 
  Trash2, 
  Pencil, 
  X, 
  Check,
  Sunrise,
  Sun,
  Sunset,
  Moon,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MemoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  currentDay: number;
  currentTimeOfDay: TimeOfDay;
  memories: Memory[];
  memoriesEnabled: boolean;
  onMemoriesChange: (memories: Memory[]) => void;
  onToggleEnabled: (enabled: boolean) => void;
  onCreateMemory: (content: string, day: number | null, timeOfDay: TimeOfDay | null) => Promise<Memory | null>;
  onUpdateMemory: (id: string, content: string) => Promise<void>;
  onDeleteMemory: (id: string) => Promise<void>;
  onDeleteAllMemories: () => Promise<void>;
}

const TimeIcon: React.FC<{ time: TimeOfDay | null }> = ({ time }) => {
  if (!time) return null;
  switch (time) {
    case 'sunrise': return <Sunrise className="w-3.5 h-3.5" />;
    case 'day': return <Sun className="w-3.5 h-3.5" />;
    case 'sunset': return <Sunset className="w-3.5 h-3.5" />;
    case 'night': return <Moon className="w-3.5 h-3.5" />;
  }
};

export const MemoriesModal: React.FC<MemoriesModalProps> = ({
  isOpen,
  onClose,
  currentDay,
  currentTimeOfDay,
  memories,
  memoriesEnabled,
  onToggleEnabled,
  onCreateMemory,
  onUpdateMemory,
  onDeleteMemory,
  onDeleteAllMemories,
}) => {
  const [isAddingMemory, setIsAddingMemory] = useState(false);
  const [newMemoryText, setNewMemoryText] = useState('');
  const [newMemoryDay, setNewMemoryDay] = useState<number>(currentDay);
  const [newMemoryTime, setNewMemoryTime] = useState<TimeOfDay>(currentTimeOfDay);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleAddMemory = async () => {
    if (!newMemoryText.trim()) {
      toast.error('Please enter a memory');
      return;
    }
    
    if (newMemoryText.length > 300) {
      toast.error('Memory is too long (max 300 characters)');
      return;
    }

    setIsSaving(true);
    try {
      await onCreateMemory(newMemoryText.trim(), newMemoryDay, newMemoryTime);
      setNewMemoryText('');
      setIsAddingMemory(false);
      toast.success('Memory saved');
    } catch (error) {
      toast.error('Failed to save memory');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartEdit = (memory: Memory) => {
    setEditingId(memory.id);
    setEditText(memory.content);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editText.trim()) {
      toast.error('Memory cannot be empty');
      return;
    }
    
    if (editText.length > 300) {
      toast.error('Memory is too long (max 300 characters)');
      return;
    }

    setIsSaving(true);
    try {
      await onUpdateMemory(id, editText.trim());
      setEditingId(null);
      setEditText('');
      toast.success('Memory updated');
    } catch (error) {
      toast.error('Failed to update memory');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await onDeleteMemory(id);
      toast.success('Memory deleted');
    } catch (error) {
      toast.error('Failed to delete memory');
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('Are you sure you want to delete all memories? This cannot be undone.')) {
      return;
    }
    
    setIsDeleting(true);
    try {
      await onDeleteAllMemories();
      toast.success('All memories deleted');
    } catch (error) {
      toast.error('Failed to delete memories');
    } finally {
      setIsDeleting(false);
    }
  };

  const sortedMemories = [...memories].sort((a, b) => {
    // Sort by day first, then by creation time
    if (a.day !== b.day) {
      return (a.day || 0) - (b.day || 0);
    }
    return a.createdAt - b.createdAt;
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Brain className="w-5 h-5 text-purple-400" />
            Manage Memories
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Description */}
          <p className="text-sm text-slate-400">
            Memories help the AI remember key events in your story. Add important moments to maintain narrative continuity.
          </p>

          {/* Toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
            <span className="text-sm font-medium text-slate-300">Enable Chat Memories</span>
            <Switch
              checked={memoriesEnabled}
              onCheckedChange={onToggleEnabled}
            />
          </div>

          {/* Memories List Header */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-300">
              Saved Memories ({memories.length})
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsAddingMemory(true);
                setNewMemoryDay(currentDay);
                setNewMemoryTime(currentTimeOfDay);
              }}
              className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add New
            </Button>
          </div>

          {/* Add Memory Form */}
          {isAddingMemory && (
            <div className="p-4 bg-slate-800/70 rounded-lg border border-purple-500/30 space-y-3 animate-in slide-in-from-top-2">
              <Textarea
                value={newMemoryText}
                onChange={(e) => setNewMemoryText(e.target.value)}
                placeholder="Enter the key event or fact to remember..."
                className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 min-h-[80px] resize-none"
                maxLength={300}
              />
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{newMemoryText.length}/300 characters</span>
              </div>
              
              {/* Day and Time selectors */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <Select
                    value={String(newMemoryDay)}
                    onValueChange={(v) => setNewMemoryDay(Number(v))}
                  >
                    <SelectTrigger className="w-24 bg-slate-900 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      {Array.from({ length: Math.max(currentDay, 30) }, (_, i) => i + 1).map(day => (
                        <SelectItem key={day} value={String(day)} className="text-white hover:bg-slate-700">
                          Day {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2">
                  <TimeIcon time={newMemoryTime} />
                  <Select
                    value={newMemoryTime}
                    onValueChange={(v) => setNewMemoryTime(v as TimeOfDay)}
                  >
                    <SelectTrigger className="w-28 bg-slate-900 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      <SelectItem value="sunrise" className="text-white hover:bg-slate-700">Sunrise</SelectItem>
                      <SelectItem value="day" className="text-white hover:bg-slate-700">Day</SelectItem>
                      <SelectItem value="sunset" className="text-white hover:bg-slate-700">Sunset</SelectItem>
                      <SelectItem value="night" className="text-white hover:bg-slate-700">Night</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsAddingMemory(false);
                    setNewMemoryText('');
                  }}
                  className="text-slate-400 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleAddMemory}
                  disabled={isSaving || !newMemoryText.trim()}
                  className="bg-purple-600 hover:bg-purple-500 text-white"
                >
                  {isSaving ? 'Saving...' : 'Save Memory'}
                </Button>
              </div>
            </div>
          )}

          {/* Memories List */}
          <ScrollArea className="h-[300px] pr-2">
            <div className="space-y-2">
              {sortedMemories.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No memories saved yet.</p>
                  <p className="text-xs mt-1">Click "Add New" or use the brain icon on messages.</p>
                </div>
              ) : (
                sortedMemories.map(memory => (
                  <div
                    key={memory.id}
                    className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors group"
                  >
                    {editingId === memory.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="bg-slate-900 border-slate-600 text-white min-h-[60px] resize-none"
                          maxLength={300}
                          autoFocus
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingId(null)}
                            className="h-7 px-2 text-slate-400"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSaveEdit(memory.id)}
                            disabled={isSaving}
                            className="h-7 px-2 bg-green-600 hover:bg-green-500"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-slate-200 leading-relaxed pr-16">
                          {memory.content}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            {memory.day && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Day {memory.day}
                              </span>
                            )}
                            {memory.timeOfDay && (
                              <span className="flex items-center gap-1">
                                <TimeIcon time={memory.timeOfDay} />
                                <span className="capitalize">{memory.timeOfDay}</span>
                              </span>
                            )}
                            {memory.source === 'message' && (
                              <span className="text-purple-400 text-[10px] uppercase tracking-wider">
                                from chat
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleStartEdit(memory)}
                              className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(memory.id)}
                              className="p-1.5 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Delete All Button */}
          {memories.length > 0 && (
            <div className="flex justify-end pt-2 border-t border-slate-700">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteAll}
                disabled={isDeleting}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                {isDeleting ? 'Deleting...' : 'Delete All'}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MemoriesModal;
