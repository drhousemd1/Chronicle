import React, { useEffect, useMemo, useState } from 'react';
import { Pencil } from 'lucide-react';
import { Character } from '@/types';
import { cn } from '@/lib/utils';
import { clampPercent, mapPreviewToTilePosition, Size2D } from '@/features/shared-builder/utils/image-position';

const CHARACTER_AVATAR_PREVIEW_SIZE = 192;
const STORY_ROSTER_TILE_HEIGHT = 140;
const STORY_ROSTER_TILE_WIDTH = 268;
const avatarNaturalSizeCache = new Map<string, Size2D>();

interface StoryRosterCharacterTileProps {
  char: Character;
  onSelect: (id: string) => void;
  errors?: string[];
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
}

export const StoryRosterCharacterTile: React.FC<StoryRosterCharacterTileProps> = ({
  char,
  onSelect,
  errors,
  isExpanded,
  onToggleExpand,
}) => {
  const hasAvatar = Boolean(char.avatarDataUrl);
  const [naturalImageSize, setNaturalImageSize] = useState<Size2D | null>(
    () => (char.avatarDataUrl ? avatarNaturalSizeCache.get(char.avatarDataUrl) ?? null : null)
  );

  useEffect(() => {
    if (!hasAvatar) {
      setNaturalImageSize(null);
      return;
    }

    const cachedSize = avatarNaturalSizeCache.get(char.avatarDataUrl!);
    if (cachedSize) {
      setNaturalImageSize(cachedSize);
      return;
    }

    let cancelled = false;
    const image = new Image();
    const commitSize = () => {
      const nextSize = {
        width: image.naturalWidth || 1,
        height: image.naturalHeight || 1,
      };
      avatarNaturalSizeCache.set(char.avatarDataUrl!, nextSize);
      if (!cancelled) setNaturalImageSize(nextSize);
    };

    image.onload = () => {
      commitSize();
    };
    image.onerror = () => {
      if (!cancelled) setNaturalImageSize(null);
    };
    image.src = char.avatarDataUrl!;
    if (image.complete && image.naturalWidth > 0) {
      commitSize();
    }

    return () => {
      cancelled = true;
    };
  }, [char.avatarDataUrl, hasAvatar]);

  const tileObjectPosition = useMemo(() => {
    const stored = {
      x: clampPercent(char.avatarPosition?.x ?? 50),
      y: clampPercent(char.avatarPosition?.y ?? 50),
    };

    if (!naturalImageSize) return stored;

    return mapPreviewToTilePosition(
      stored,
      naturalImageSize,
      { width: CHARACTER_AVATAR_PREVIEW_SIZE, height: CHARACTER_AVATAR_PREVIEW_SIZE },
      { width: STORY_ROSTER_TILE_WIDTH, height: STORY_ROSTER_TILE_HEIGHT }
    );
  }, [char.avatarPosition?.x, char.avatarPosition?.y, naturalImageSize]);

  return (
    <div className="space-y-1">
      <div
        className={cn(
          'group relative overflow-hidden rounded-2xl bg-black transition-all duration-300',
          isExpanded ? '' : 'h-[140px]',
          errors && errors.length > 0 ? 'border border-red-500' : 'border border-[#4a5f7f]'
        )}
      >
        {hasAvatar ? (
          <img
            src={char.avatarDataUrl}
            alt={char.name}
            className={`block w-full transition-[height,object-fit] duration-300 ${isExpanded ? 'h-auto object-contain object-top' : 'h-full object-cover'}`}
            style={isExpanded ? undefined : { objectPosition: `${tileObjectPosition.x}% ${tileObjectPosition.y}%` }}
          />
        ) : (
          <div className="flex h-full min-h-[140px] items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900 font-black text-5xl italic uppercase text-slate-500">
            {char.name.charAt(0)}
          </div>
        )}

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-200 z-[5] pointer-events-none" />

        {hasAvatar && (
          <button
            type="button"
            onClick={() => onToggleExpand(char.id)}
            className="absolute inset-0 z-20"
            aria-label={isExpanded ? `Collapse ${char.name} avatar` : `Expand ${char.name} avatar`}
          />
        )}

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onSelect(char.id);
          }}
          className="absolute right-2 top-2 z-30 rounded-lg bg-black/35 p-1.5 text-white/75 transition-colors hover:bg-black/55 hover:text-white"
          aria-label={`Edit ${char.name}`}
        >
          <Pencil className="w-4 h-4" />
        </button>

        <div className="absolute inset-x-0 bottom-0 z-30 p-3">
          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">
                {char.name}
              </div>
            </div>
            <span
              className={cn(
                'text-[9px] font-black uppercase tracking-wide shrink-0 rounded-full px-2 py-0.5',
                char.controlledBy === 'User' ? 'bg-blue-500 text-white' : 'bg-slate-500 text-white'
              )}
            >
              {char.controlledBy}
            </span>
          </div>
        </div>
      </div>

      {errors && errors.length > 0 && (
        <div className="pl-2 space-y-0.5">
          {errors.map((error, index) => (
            <p key={index} className="text-sm text-red-500 font-medium">
              {error}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};
