// Dedicated component for displaying AI-generated side characters
// Separate from main character card for easier future modifications

import React from 'react';
import { SideCharacter } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Loader2, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SideCharacterCardProps {
  character: SideCharacter;
  onStartEdit?: () => void;
  onDelete?: () => void;
  isUpdating?: boolean;
}

export const SideCharacterCard: React.FC<SideCharacterCardProps> = ({
  character,
  onStartEdit,
  onDelete,
  isUpdating = false
}) => {
  return (
    <div className={`rounded-2xl transition-all duration-300 border-2 backdrop-blur-sm relative bg-white/30 border-transparent hover:bg-white ${isUpdating ? 'ring-2 ring-blue-400/60' : ''}`}>
      {/* Blue vignette overlay - scoped to this card */}
      {isUpdating && (
        <div 
          className="absolute inset-0 z-[1] pointer-events-none rounded-2xl overflow-hidden animate-vignette-pulse"
          style={{
            background: 'radial-gradient(ellipse 120% 100% at center 30%, transparent 25%, rgba(59, 130, 246, 0.25) 50%, rgba(59, 130, 246, 0.5) 80%, rgba(59, 130, 246, 1) 100%)'
          }}
        />
      )}
      
      {/* "Updating..." text overlay - top-left with ethereal glow */}
      {isUpdating && (
        <div className="absolute top-3 left-3 z-20 pointer-events-none">
          <span 
            className="text-indigo-200/90 text-xs italic font-light tracking-tight animate-in fade-in zoom-in-95 duration-500"
            style={{
              textShadow: '0 0 8px rgba(129, 140, 248, 0.6), 0 0 16px rgba(129, 140, 248, 0.4), 0 0 24px rgba(129, 140, 248, 0.2)'
            }}
          >
            Updating...
          </span>
        </div>
      )}
      <div className="relative">
        <div className="w-full flex flex-col items-center gap-2 p-3 text-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-2 shadow-sm overflow-hidden bg-purple-50 transition-all duration-300 border-purple-100">
              {character.isAvatarGenerating ? (
                <div className="w-full h-full flex items-center justify-center bg-purple-100">
                  <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
                </div>
              ) : character.avatarDataUrl ? (
                <img src={character.avatarDataUrl} alt={character.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-black text-purple-300 text-xl italic uppercase">
                  {character.name.charAt(0)}
                </div>
              )}
            </div>
            <Badge 
              variant={character.controlledBy === 'User' ? 'default' : 'secondary'}
              className={`absolute -bottom-1 -right-1 text-[8px] px-1.5 py-0.5 shadow-sm border-0 ${
                character.controlledBy === 'User' 
                  ? 'bg-blue-500 hover:bg-blue-500 text-white' 
                  : 'bg-slate-500 hover:bg-slate-500 text-white'
              }`}
            >
              {character.controlledBy}
            </Badge>
          </div>
          <div className="text-sm font-bold tracking-tight text-slate-800">
            {character.name}
          </div>
        </div>
        
        {/* Edit dropdown menu - always visible */}
        {onStartEdit && (
          <div className="absolute top-2 right-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-colors">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white border-slate-200 shadow-lg z-50">
                <DropdownMenuItem onClick={onStartEdit}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit character
                </DropdownMenuItem>
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={onDelete}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete character
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  );
};

export default SideCharacterCard;
