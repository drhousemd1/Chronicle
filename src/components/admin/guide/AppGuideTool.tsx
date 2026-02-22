import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { GuideSidebar, type GuideDocument, type TocEntry } from './GuideSidebar';
import { GuideEditor } from './GuideEditor';

export const AppGuideTool: React.FC = () => {
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
    setActiveDocId(id);
    setTocEntries([]);
    const { data } = await (supabase as any)
      .from('guide_documents')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (data) {
      setActiveDocTitle(data.title);
      setActiveDocMarkdown(data.markdown || '');
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
    const { error } = await (supabase as any)
      .from('guide_documents')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
      return;
    }

    setDocuments((prev) => prev.filter((d) => d.id !== id));
    if (activeDocId === id) {
      setActiveDocId(null);
      setActiveDocTitle('');
      setActiveDocMarkdown('');
      setTocEntries([]);
    }
  }, [activeDocId]);

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

  // TOC click → scroll textarea to approximate heading position
  const handleTocClick = useCallback((blockId: string) => {
    // blockId is "line-N" — we could scroll the textarea but it's simple text
    // For now this is a no-op; the TOC just shows structure
  }, []);

  return (
    <div className="flex h-full w-full">
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
      />
    </div>
  );
};
