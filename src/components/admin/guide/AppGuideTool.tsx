import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

/** Fire-and-forget sync to GitHub repo */
function syncToGitHub(action: 'upsert' | 'delete', title: string, markdown?: string) {
  supabase.functions
    .invoke('sync-guide-to-github', {
      body: { action, title, markdown },
    })
    .then(({ error, data }) => {
      if (error) {
        console.error('GitHub sync request failed:', error);
        return;
      }

      if (data?.success === false) {
        console.warn('GitHub sync warning:', data.error);
        return;
      }

      console.log('GitHub sync:', data);
    });
}

import { GuideSidebar, type GuideDocument, type TocEntry } from './GuideSidebar';
import { GuideEditor } from './GuideEditor';

interface AppGuideToolProps {
  onRegisterSave?: (saveFn: (() => Promise<void>) | null) => void;
  onRegisterSyncAll?: (syncFn: (() => Promise<void>) | null) => void;
}

export const AppGuideTool: React.FC<AppGuideToolProps> = ({ onRegisterSave, onRegisterSyncAll }) => {
  const [documents, setDocuments] = useState<GuideDocument[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [activeDocTitle, setActiveDocTitle] = useState('');
  const [activeDocMarkdown, setActiveDocMarkdown] = useState('');
  const [tocEntries, setTocEntries] = useState<TocEntry[]>([]);

  // Fetch document list
  const fetchDocs = useCallback(async () => {
    const { data } = await (supabase as any)
      .from('guide_documents')
      .select('id, title, sort_order')
      .order('sort_order', { ascending: true });
    if (data) setDocuments(data);
  }, []);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  // Load a document
  const loadDoc = useCallback(async (id: string) => {
    setTocEntries([]);
    const { data } = await (supabase as any)
      .from('guide_documents')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (data) {
      setActiveDocId(id);
      setActiveDocTitle(data.title);
      setActiveDocMarkdown(data.markdown || '');
      setDocuments((prev) =>
        prev.map((d) => (d.id === id ? { ...d, title: data.title } : d))
      );
    }
  }, []);

  // Create new document
  const handleNewDoc = useCallback(async () => {
    const maxSort = documents.length > 0
      ? Math.max(...documents.map((d) => d.sort_order))
      : -1;

    const { data, error } = await (supabase as any)
      .from('guide_documents')
      .insert({ title: 'Untitled Document', sort_order: maxSort + 1 })
      .select('id, title, sort_order')
      .single();

    if (data && !error) {
      setDocuments((prev) => [...prev, data]);
      loadDoc(data.id);
    }
  }, [documents, loadDoc]);

  // Delete document
  const handleDeleteDoc = useCallback(async (id: string) => {
    // Find title before removing from state
    const doc = documents.find((d) => d.id === id);
    const { error } = await (supabase as any)
      .from('guide_documents')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete failed:', error.message);
      return;
    }

    // Sync delete to GitHub
    if (doc) syncToGitHub('delete', doc.title);

    setDocuments((prev) => prev.filter((d) => d.id !== id));
    if (activeDocId === id) {
      setActiveDocId(null);
      setActiveDocTitle('');
      setActiveDocMarkdown('');
      setTocEntries([]);
    }
  }, [activeDocId, documents]);

  // Title change
  const handleTitleChange = useCallback(async (id: string, newTitle: string) => {
    const { error } = await (supabase as any)
      .from('guide_documents')
      .update({ title: newTitle })
      .eq('id', id);
    if (error) {
      console.error('Rename failed:', error.message);
      return;
    }
    setActiveDocTitle(newTitle);
    setDocuments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, title: newTitle } : d))
    );
  }, []);

  // TOC click
  const handleTocClick = useCallback((_blockId: string) => {
    // no-op for now
  }, []);

  // Register save callback for external header button
  useEffect(() => {
    if (!onRegisterSave) return;
    if (!activeDocId) {
      onRegisterSave(null);
      return;
    }
    const saveFn = async () => {
      const { error } = await (supabase as any)
        .from('guide_documents')
        .update({ markdown: activeDocMarkdown, updated_at: new Date().toISOString() })
        .eq('id', activeDocId);
      if (error) {
        console.error('Save failed:', error.message);
      } else {
        console.log('Document saved');
        // Sync to GitHub after successful DB save
        syncToGitHub('upsert', activeDocTitle, activeDocMarkdown);
      }
    };
    onRegisterSave(saveFn);
    return () => onRegisterSave(null);
  }, [onRegisterSave, activeDocId, activeDocTitle, activeDocMarkdown]);

  // Register sync-all callback for external header button
  useEffect(() => {
    if (!onRegisterSyncAll) return;
    const syncAllFn = async () => {
      const { data, error } = await (supabase as any)
        .from('guide_documents')
        .select('id, title, markdown');
      if (error) {
        console.error('Failed to fetch documents for sync:', error.message);
        return;
      }
      if (!data || data.length === 0) {
        console.log('No documents to sync');
        return;
      }
      console.log(`Syncing ${data.length} documents to GitHub...`);
      for (const doc of data) {
        syncToGitHub('upsert', doc.title, doc.markdown || '');
      }
      console.log('Bulk sync dispatched');
    };
    onRegisterSyncAll(syncAllFn);
    return () => onRegisterSyncAll(null);
  }, [onRegisterSyncAll]);

  return (

    <div className="flex flex-col h-full w-full">
      {/* Page header */}
      <div className="flex items-center justify-between px-4 shrink-0 bg-black" style={{ height: 52, borderBottom: '1px solid #222' }}>
        <h2 className="text-[hsl(var(--ui-text))] text-sm font-bold uppercase tracking-wider">App Guide</h2>
      </div>

      {/* Content */}
      <div className="flex flex-1 min-h-0">
        <GuideSidebar
          documents={documents}
          activeDocId={activeDocId}
          tocEntries={tocEntries}
          onSelectDoc={loadDoc}
          onNewDoc={handleNewDoc}
          onDeleteDoc={handleDeleteDoc}
          onTocClick={handleTocClick}
        />
        <GuideEditor
          key={activeDocId}
          docId={activeDocId}
          docTitle={activeDocTitle}
          docMarkdown={activeDocMarkdown}
          onTitleChange={handleTitleChange}
          onTocUpdate={setTocEntries}
          onMarkdownChange={(md) => setActiveDocMarkdown(md)}
        />
      </div>
    </div>
  );
};
