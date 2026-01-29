import React, { useState } from 'react';
import { Button } from './UI';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Upload, Image as ImageIcon } from 'lucide-react';
import { ImageLibraryPickerModal } from './ImageLibraryPickerModal';

interface UploadSourceMenuProps {
  onUploadFromDevice: () => void;
  onSelectFromLibrary: (imageUrl: string) => void;
  disabled?: boolean;
  label?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
  isUploading?: boolean;
}

export const UploadSourceMenu: React.FC<UploadSourceMenuProps> = ({
  onUploadFromDevice,
  onSelectFromLibrary,
  disabled = false,
  label = 'Upload Image',
  variant = 'primary',
  className = '',
  isUploading = false,
}) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
            disabled={disabled || isUploading}
            className={`gap-2 ${className}`}
          >
            {isUploading ? 'Uploading...' : label}
            <ChevronDown className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48 bg-white border-slate-200 shadow-lg z-50">
          <DropdownMenuItem
            onClick={onUploadFromDevice}
            className="cursor-pointer"
          >
            <Upload className="w-4 h-4 mr-2" />
            From Device
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setIsPickerOpen(true)}
            className="cursor-pointer"
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            From Library
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ImageLibraryPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={(imageUrl) => {
          onSelectFromLibrary(imageUrl);
          setIsPickerOpen(false);
        }}
      />
    </>
  );
};
