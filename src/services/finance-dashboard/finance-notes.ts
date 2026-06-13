import { supabase } from "@/integrations/supabase/client";

export const ADMIN_NOTES_KEY = "overview_notes";

export async function fetchAdminOverviewNote() {
  const { data, error } = await supabase
    .from("admin_notes")
    .select("content_html, updated_at")
    .eq("note_key", ADMIN_NOTES_KEY)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function saveAdminOverviewNote(contentHtml: string) {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user?.id) throw new Error("Authentication required");

  const { data, error } = await supabase
    .from("admin_notes")
    .upsert({
      note_key: ADMIN_NOTES_KEY,
      content: contentHtml.replace(/<[^>]*>/g, ""),
      content_html: contentHtml,
      author_id: authData.user.id,
      updated_by: authData.user.id,
    }, { onConflict: "note_key" })
    .select("updated_at")
    .single();

  if (error) throw error;
  return data;
}
