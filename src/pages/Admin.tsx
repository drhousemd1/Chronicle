import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AdminToolEditModal, type ToolMeta } from '@/components/admin/AdminToolEditModal';
import { ModelSettingsTab } from '@/components/chronicle/ModelSettingsTab';
import { supabase } from '@/integrations/supabase/client';

const LazyImageGen = React.lazy(() =>
  import('@/components/admin/ImageGenerationTool').then(m => ({ default: m.ImageGenerationTool }))
);
const LazyFinanceDashboard = React.lazy(() =>
  import('@/components/admin/finance/FinanceDashboardTool')
);
const LazyResearchDevelopment = React.lazy(() =>
  import('@/components/admin/research-development/ResearchDevelopmentTool').then(m => ({ default: m.ResearchDevelopmentTool }))
);

const lazyToolFallback = <div className="h-full w-full" />;

const DEFAULT_TOOLS: ToolMeta[] = [
  {
    id: 'image_generation',
    title: 'Image Generation',
    description: 'Edit art style names, thumbnails, and injection prompts',
    thumbnailUrl: '/images/styles/cinematic-2-5d.png',
  },
  {
    id: 'model_settings',
    title: 'AI Status',
    description: 'View active models and backend health',
  },
  {
    id: 'chronicle_ui_guide',
    title: 'Chronicle UI Guide',
    description: 'Page styling, reusable patterns, and examples for building consistent Chronicle interfaces',
  },
  {
    id: 'chronicle_knowledge_base',
    title: 'Chronicle Knowledge Base',
    description: 'Product behavior, UI functions, architecture, current work, and source references',
  },
  {
    id: 'supabase_schema_reference',
    title: 'Supabase Schema Reference',
    description: 'Source-backed table, RLS, and storage reference for Lovable/Supabase changes',
  },
  {
    id: 'quality_hub',
    title: 'Quality Hub',
    description: 'Scan runs, issue registry, changelog, and validation history',
  },
  {
    id: 'validation_evidence_ledger',
    title: 'Validation Evidence Ledger',
    description: 'Track validation results, failure causes, and evidence artifacts',
  },
  {
    id: 'finance_dashboard',
    title: 'Finance Dashboard',
    description: 'Business finance operations, projections, users, reporting, and API cost insights',
  },
  {
    id: 'research_development',
    title: 'Research & Development',
    description: 'Build protected mock-ups alongside editable notes and reference images',
  },
  {
    id: 'roadmap',
    title: 'Roadmap',
    description: 'Issues, improvements, and ideas organized by priority',
  },
];

interface AdminPageProps {
  activeTool: string;
  onSetActiveTool: (tool: string) => void;
  onRegisterRndBeforeLeave?: (fn: (() => Promise<boolean>) | null) => void;
  onRegisterRndAddMockup?: (fn: (() => Promise<void>) | null) => void;
  onRegisterRndRepositorySave?: (fn: (() => Promise<void>) | null) => void;
  onRndRepositorySaveStateChange?: (state: 'idle' | 'saving' | 'saved' | 'error') => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ activeTool, onSetActiveTool, onRegisterRndBeforeLeave, onRegisterRndAddMockup, onRegisterRndRepositorySave, onRndRepositorySaveStateChange }) => {
  const navigate = useNavigate();
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
          setTools(DEFAULT_TOOLS.map((tool) => ({ ...tool, ...overrides[tool.id] })));
        }
      } catch {
        // keep defaults
      }
    })();
  }, []);

  const handleSaveTool = async (toolId: string, patch: Partial<ToolMeta>) => {
    const nextTools = tools.map((t) => (t.id === toolId ? { ...t, ...patch } : t));
    setTools(nextTools);

    try {
      const overrides: Record<string, Partial<ToolMeta>> = {};
      nextTools.forEach((merged) => {
        overrides[merged.id] = { title: merged.title, description: merged.description, thumbnailUrl: merged.thumbnailUrl };
      });

      const { data: updatedRows, error: updateError } = await supabase
        .from('app_settings')
        .update({ setting_value: overrides as any, updated_at: new Date().toISOString() })
        .eq('setting_key', 'admin_tool_meta')
        .select('id');

      if (updateError) throw updateError;

      if (!updatedRows || updatedRows.length === 0) {
        const { error: insertError } = await supabase
          .from('app_settings')
          .insert({ setting_key: 'admin_tool_meta', setting_value: overrides as any });
        if (insertError) throw insertError;
      }
    } catch (e) {
      console.error('Failed to persist tool meta:', e);
      setTools(tools);
      throw e;
    }
  };

  const handleOpenTool = (toolId: string) => {
    if (toolId === 'roadmap') {
      navigate('/admin/roadmap');
      return;
    }

    if (toolId === 'chronicle_ui_guide') {
      navigate('/style-guide/chronicle-ui-guide');
      return;
    }

    if (toolId === 'chronicle_knowledge_base') {
      navigate('/style-guide/chronicle-knowledge-base');
      return;
    }

    if (toolId === 'supabase_schema_reference') {
      navigate('/style-guide/supabase-schema-reference');
      return;
    }

    if (toolId === 'quality_hub') {
      navigate('/style-guide/ui-audit');
      return;
    }

    if (toolId === 'validation_evidence_ledger') {
      navigate('/style-guide/validation-evidence-ledger');
      return;
    }

    onSetActiveTool(toolId);
  };

  if (activeTool === 'image_generation') {
    return (
      <React.Suspense fallback={lazyToolFallback}>
        <LazyImageGen />
      </React.Suspense>
    );
  }

  if (activeTool === 'model_settings') {
    return (
      <div className="p-10 overflow-y-auto h-full">
        <ModelSettingsTab />
      </div>
    );
  }

  if (activeTool === 'finance_dashboard') {
    return (
      <React.Suspense fallback={lazyToolFallback}>
        <LazyFinanceDashboard />
      </React.Suspense>
    );
  }

  if (activeTool === 'research_development') {
    return (
      <React.Suspense fallback={lazyToolFallback}>
        <LazyResearchDevelopment
          onOpenStyleGuide={() => navigate('/style-guide/chronicle-ui-guide')}
          onRegisterBeforeLeave={onRegisterRndBeforeLeave}
          onRegisterAddMockup={onRegisterRndAddMockup}
          onRegisterRepositorySave={onRegisterRndRepositorySave}
          onRepositorySaveStateChange={onRndRepositorySaveStateChange}
        />
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
            onClick={() => handleOpenTool(tool.id)}
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

              <div className="absolute inset-x-0 bottom-0 p-5">
                <h3
                  className={
                    tool.id === 'chronicle_knowledge_base'
                      ? 'text-white font-bold text-sm leading-tight'
                      : 'text-white font-bold text-base truncate'
                  }
                >
                  {tool.title}
                </h3>
                <p className="text-slate-300 text-xs mt-1 italic line-clamp-2">
                  {tool.description}
                </p>
              </div>

              <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all bg-black/30">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setEditingTool(tool); }}
                  className="px-4 py-2 bg-white text-[hsl(var(--ui-surface-2))] font-bold text-xs uppercase tracking-wider rounded-xl shadow-xl hover:bg-slate-100 transition-colors"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleOpenTool(tool.id); }}
                  className="px-4 py-2 bg-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xl hover:bg-blue-600 transition-colors"
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
