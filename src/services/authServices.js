import { supabase } from "../utils/supabase";

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return {
    $id: data.user.id,
    name: data.user.user_metadata?.name || data.user.user_metadata?.full_name || "",
    email: data.user.email || "",
  };
}

export async function loginAdmin(email, password) {
  const normalizedEmail = String(email || "").trim();
  if (!normalizedEmail) throw new Error("Email is required.");
  if (!password) throw new Error("Password is required.");

  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });
  if (error) throw error;
  return data.session;
}

export async function logoutAdmin() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  return true;
}

export async function getManagementAccess(user) {
  if (!user?.$id) {
    return { isMember: false, roles: [], membership: null };
  }

  const { data, error } = await supabase
    .from("management_memberships")
    .select("*")
    .eq("user_id", user.$id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return { isMember: false, roles: [], membership: null };

  return {
    isMember: true,
    roles: [data.role],
    membership: {
      ...data,
      roles: [data.role],
      confirm: true,
    },
  };
}
