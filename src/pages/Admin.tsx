import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { ImageGenerationTool } from '@/components/admin/ImageGenerationTool';
import { AdminToolEditModal, type ToolMeta } from '@/components/admin/AdminToolEditModal';
import { ModelSettingsTab } from '@/components/chronicle/ModelSettingsTab';
const AppGuideTool = React.lazy(() =>
  import('../components/admin/guide/AppGuideTool').then(m => ({ default: m.AppGuideTool }))
);
import { supabase } from '@/integrations/supabase/client';

const DEFAULT_TOOLS: ToolMeta[] = [
  {
    id: 'image_generation',
    title: 'Image Generation',
    description: 'Edit art style names, thumbnails, and injection prompts',
    thumbnailUrl: '/images/styles/cinematic-2-5d.png',
  },
  {
    id: 'model_settings',
    title: 'Model Settings',
    description: 'Select Grok model and manage API key sharing',
  },
  {
    id: 'app_guide',
    title: 'App Guide',
    description: 'Complete documentation for every page and system',
  },
];

interface AdminPageProps {
  activeTool: string;
  onSetActiveTool: (tool: string) => void;
  selectedModelId: string;
  onSelectModel: (id: string) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ activeTool, onSetActiveTool, selectedModelId, onSelectModel }) => {
  const [tools, setTools] = useState<ToolMeta[]>(DEFAULT_TOOLS);
  const [editingTool, setEditingTool] = useState<ToolMeta | null>(null);

  // Load custom metadata from app_settings on mount
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from('app_settings')
          .select('setting_value')
          .eq('setting_key', 'admin_tool_meta')
          .maybeSingle();
        if (data?.setting_value && typeof data.setting_value === 'object') {
          const overrides = data.setting_value as Record<string, Partial<ToolMeta>>;
          setTools(DEFAULT_TOOLS.map((t) => ({ ...t, ...overrides[t.id] })));
        }
      } catch {
        // keep defaults
      }
    })();
  }, []);

  const handleSaveTool = async (toolId: string, patch: Partial<ToolMeta>) => {
    setTools((prev) => prev.map((t) => (t.id === toolId ? { ...t, ...patch } : t)));

    try {
      const overrides: Record<string, Partial<ToolMeta>> = {};
      tools.forEach((t) => {
        const merged = t.id === toolId ? { ...t, ...patch } : t;
        overrides[t.id] = { title: merged.title, description: merged.description, thumbnailUrl: merged.thumbnailUrl };
      });

      const { error: updateError } = await supabase
        .from('app_settings')
        .update({ setting_value: overrides as any, updated_at: new Date().toISOString() })
        .eq('setting_key', 'admin_tool_meta');

      if (updateError) {
        await supabase
          .from('app_settings')
          .insert({ setting_key: 'admin_tool_meta', setting_value: overrides as any });
      }
    } catch (e) {
      console.error('Failed to persist tool meta:', e);
    }
  };

  if (activeTool === 'image_generation') {
    return <ImageGenerationTool />;
  }

  if (activeTool === 'model_settings') {
    return (
      <div className="p-10 overflow-y-auto h-full">
        <ModelSettingsTab selectedModelId={selectedModelId} onSelectModel={onSelectModel} />
      </div>
    );
  }

  if (activeTool === 'app_guide') {
    return (
      <React.Suspense fallback={<div className="flex-1 flex items-center justify-center h-full bg-black"><span className="text-muted-foreground text-sm">Loading editor...</span></div>}>
        <AppGuideTool />
      </React.Suspense>
    );
  }

  return (
    <div className="w-full h-full p-4 lg:p-10 flex flex-col overflow-y-auto bg-black">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 lg:gap-8">
        {tools.map((tool) => (
          <div
            key={tool.id}
            className="group relative cursor-pointer"
            onClick={() => onSetActiveTool(tool.id)}
          >
            <div className="aspect-[2/3] w-full overflow-hidden rounded-[2rem] bg-slate-200 shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)] transition-all duration-300 group-hover:-translate-y-3 group-hover:shadow-2xl border border-[#4a5f7f] relative">
              {tool.thumbnailUrl ? (
                <img
                  src={tool.thumbnailUrl}
                  alt={tool.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                  <Sparkles className="w-12 h-12 text-zinc-600" />
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent pointer-events-none" />

              <div className="absolute inset-x-0 bottom-0 p-5">
                <h3 className="text-white font-bold text-base truncate">{tool.title}</h3>
                <p className="text-slate-300 text-xs mt-1 italic line-clamp-2">
                  {tool.description}
                </p>
              </div>

              <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all bg-black/30">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setEditingTool(tool); }}
                  className="px-4 py-2 bg-white text-slate-900 font-bold text-xs uppercase tracking-wider rounded-xl shadow-xl hover:bg-slate-100 transition-colors"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onSetActiveTool(tool.id); }}
                  className="px-4 py-2 bg-blue-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xl hover:bg-blue-700 transition-colors"
                >
                  Open
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AdminToolEditModal
        isOpen={!!editingTool}
        onClose={() => setEditingTool(null)}
        tool={editingTool}
        onSave={handleSaveTool}
      />
    </div>
  );
};

export default AdminPage;
