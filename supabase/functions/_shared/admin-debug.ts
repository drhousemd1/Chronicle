type AdminDebugRoleClient = {
  rpc: (
    functionName: string,
    args: Record<string, unknown>,
  ) => PromiseLike<{ data: unknown; error: unknown }>;
};

export async function shouldReturnAdminDebugTrace(
  supabase: AdminDebugRoleClient,
  userId: string,
  requested: unknown,
  logScope = "[admin-debug]",
): Promise<boolean> {
  if (requested !== true) return false;

  const { data: isAdmin, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error) {
    console.error(`${logScope} Debug trace admin role check failed:`, error);
  }

  return isAdmin === true;
}
