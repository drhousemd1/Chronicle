import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { ImageGenerationTool } from '@/components/admin/ImageGenerationTool';

type AdminTool = 'hub' | 'image_generation';

const TOOLS = [
  {
    id: 'image_generation' as AdminTool,
    title: 'Image Generation',
    description: 'Edit art style names, thumbnails, and injection prompts',
    icon: Sparkles,
    thumbnailUrl: '/images/styles/cinematic-2-5d.png',
  },
];

export const AdminPage: React.FC = () => {
  const [activeTool, setActiveTool] = useState<AdminTool>('hub');

  if (activeTool === 'image_generation') {
    return <ImageGenerationTool onBack={() => setActiveTool('hub')} />;
  }

  return (
    <div className="w-full h-full p-4 lg:p-10 flex flex-col overflow-y-auto bg-black">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 lg:gap-8">
        {TOOLS.map((tool) => (
          <div
            key={tool.id}
            className="group relative cursor-pointer"
            onClick={() => setActiveTool(tool.id)}
          >
            <div className="aspect-[2/3] w-full overflow-hidden rounded-[2rem] bg-slate-200 shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)] transition-all duration-300 group-hover:-translate-y-3 group-hover:shadow-2xl border border-[#4a5f7f] relative">
              {/* Thumbnail image */}
              {tool.thumbnailUrl ? (
                <img
                  src={tool.thumbnailUrl}
                  alt={tool.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                  <tool.icon className="w-12 h-12 text-zinc-600" />
                </div>
              )}

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent pointer-events-none" />

              {/* Bottom text overlay */}
              <div className="absolute inset-x-0 bottom-0 p-5">
                <h3 className="text-white font-bold text-base truncate">{tool.title}</h3>
                <p className="text-slate-300 text-xs mt-1 italic line-clamp-2">
                  {tool.description}
                </p>
              </div>

              {/* Hover action overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                <button
                  type="button"
                  className="px-6 py-2.5 rounded-xl bg-white/20 text-white font-semibold text-sm hover:brightness-125 active:brightness-150 transition-all backdrop-blur-sm border border-white/20"
                >
                  Open
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminPage;
