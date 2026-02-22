import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GuideSidebar, type GuideDocument, type TocEntry } from './GuideSidebar';
import { GuideEditor } from './GuideEditor';

export const AppGuideTool: React.FC = () => {
  const [documents, setDocuments] = useState<GuideDocument[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [activeDocTitle, setActiveDocTitle] = useState('');
  const [activeDocContent, setActiveDocContent] = useState<any>(null);
  const [tocEntries, setTocEntries] = useState<TocEntry[]>([]);

  // Fetch document list
  const fetchDocs = useCallback(async () => {
    const { data } = await (supabase as any)
      .from('guide_documents')
      .select('id, title, sort_order')
      .order('sort_order', { ascending: true });
    if (data) setDocuments(data);
  }, []);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  // Load a document
  const loadDoc = useCallback(async (id: string) => {
    setActiveDocId(id);
    setTocEntries([]);
    const { data } = await (supabase as any)
      .from('guide_documents')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (data) {
      setActiveDocTitle(data.title);
      setActiveDocContent(data.content);
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

  // Title change
  const handleTitleChange = useCallback(async (id: string, newTitle: string) => {
    await (supabase as any)
      .from('guide_documents')
      .update({ title: newTitle })
      .eq('id', id);
    setActiveDocTitle(newTitle);
    setDocuments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, title: newTitle } : d))
    );
  }, []);

  // TOC click → scroll to heading
  const handleTocClick = useCallback((blockId: string) => {
    const el = document.querySelector(`[data-id="${blockId}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <div className="flex h-full w-full">
      <GuideSidebar
        documents={documents}
        activeDocId={activeDocId}
        tocEntries={tocEntries}
        onSelectDoc={loadDoc}
        onNewDoc={handleNewDoc}
        onTocClick={handleTocClick}
      />
      <GuideEditor
        key={activeDocId}
        docId={activeDocId}
        docTitle={activeDocTitle}
        docContent={activeDocContent}
        onTitleChange={handleTitleChange}
        onTocUpdate={setTocEntries}
      />
    </div>
  );
};
