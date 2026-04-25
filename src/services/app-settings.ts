import { supabase } from "@/integrations/supabase/client";

const ADMIN_STATE_CACHE_KEY = "chronicle.admin-state.v1";

export interface SharedKeyStatus {
  xaiShared: boolean;
  xaiConfigured: boolean;
  providerReachable: boolean;
}

export async function checkSharedKeyStatus(): Promise<SharedKeyStatus> {
  try {
    const { data, error } = await supabase.functions.invoke('check-shared-keys');
    if (error) {
      console.error('Error checking shared key status:', error);
      return { xaiShared: false, xaiConfigured: false, providerReachable: false };
    }
    return data as SharedKeyStatus;
  } catch {
    return { xaiShared: false, xaiConfigured: false, providerReachable: false };
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

export function readCachedAdminState(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(ADMIN_STATE_CACHE_KEY) === 'true';
}

export function writeCachedAdminState(isAdmin: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ADMIN_STATE_CACHE_KEY, isAdmin ? 'true' : 'false');
  } catch {
    // Never let admin-state caching break the app shell.
  }
}

export async function updateSharedKeySetting(xaiShared: boolean): Promise<boolean> {
  try {
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
