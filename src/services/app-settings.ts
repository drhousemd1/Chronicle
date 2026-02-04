import { supabase } from "@/integrations/supabase/client";

const ADMIN_USER_ID = "98d690d7-ac5a-4b04-b15e-78b462f5eec6";

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

export function isAdminUser(userId: string | undefined): boolean {
  return userId === ADMIN_USER_ID;
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
