import React, { useState } from 'react';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { ImageGenerationTool } from '@/components/admin/ImageGenerationTool';

type AdminTool = 'hub' | 'image_generation';

interface AdminPageProps {
  onBack?: () => void;
}

const TOOLS = [
  {
    id: 'image_generation' as AdminTool,
    title: 'Image Generation',
    description: 'Edit art style names, thumbnails, and injection prompts',
    icon: Sparkles,
    thumbnailUrl: '/images/styles/cinematic-2-5d.png',
  },
];

export const AdminPage: React.FC<AdminPageProps> = ({ onBack }) => {
  const [activeTool, setActiveTool] = useState<AdminTool>('hub');

  if (activeTool === 'image_generation') {
    return <ImageGenerationTool onBack={() => setActiveTool('hub')} />;
  }

  return (
    <div className="h-full bg-black text-white overflow-y-auto">
      <div className="p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold">Admin Panel</h1>
            <p className="text-sm text-slate-400 mt-1">
              Application management tools
            </p>
          </div>
        </div>

        {/* Tool Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {TOOLS.map((tool) => (
            <button
              key={tool.id}
              type="button"
              onClick={() => setActiveTool(tool.id)}
              className="group rounded-2xl border border-white/10 bg-[hsl(var(--ui-surface-2))] shadow-[0_10px_30px_rgba(0,0,0,0.35)] overflow-hidden transition-all hover:brightness-125 active:brightness-150 text-left cursor-pointer"
            >
              <div className="aspect-square bg-zinc-900 relative overflow-hidden">
                {tool.thumbnailUrl ? (
                  <img
                    src={tool.thumbnailUrl}
                    alt={tool.title}
                    className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <tool.icon className="w-12 h-12 text-zinc-600" />
                  </div>
                )}
                {/* Gradient overlay */}
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />
              </div>
              <div className="p-4">
                <h3 className="font-bold text-sm text-white truncate">{tool.title}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  {tool.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
