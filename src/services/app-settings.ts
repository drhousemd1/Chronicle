import { supabase } from "@/integrations/supabase/client";

export interface SharedKeyStatus {
  xaiShared: boolean;
  xaiConfigured: boolean;
}

export async function checkSharedKeyStatus(): Promise<SharedKeyStatus> {
  try {
    const { data, error } = await supabase.functions.invoke('check-shared-keys');
    if (error) {
      console.error('Error checking shared key status:', error);
      return { xaiShared: false, xaiConfigured: false };
    }
    return data as SharedKeyStatus;
  } catch {
    return { xaiShared: false, xaiConfigured: false };
  }
}

export async function checkIsAdmin(userId: string | undefined): Promise<boolean> {
  if (!userId) return false;
  try {
    const { data, error } = await supabase.rpc('has_role', { _user_id: userId, _role: 'admin' });
    if (error) { console.error('Admin check failed:', error); return false; }
    return data === true;
  } catch {
    return false;
  }
}

export async function updateSharedKeySetting(xaiShared: boolean): Promise<boolean> {
  try {
    // Using type assertion to work around generated types not including app_settings yet
    const { error } = await (supabase as any)
      .from('app_settings')
      .update({ 
        setting_value: { xai: xaiShared },
        updated_at: new Date().toISOString()
      })
      .eq('setting_key', 'shared_keys');
    
    if (error) {
      console.error('Error updating shared key setting:', error);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Error updating shared key setting:', e);
    return false;
  }
}
