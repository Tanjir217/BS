import { supabase } from "../utils/supabase";

function mapUser(user) {
  if (!user) return null;
  return {
    $id: user.id,
    name: user.user_metadata?.name || user.user_metadata?.full_name || "",
    email: user.email || "",
  };
}

export async function getCurrentCustomer() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return mapUser(data.user);
}

export async function registerCustomer({ email, password, name }) {
  const normalizedEmail = String(email || "").trim();
  const normalizedName = String(name || "").trim();

  if (!normalizedEmail) throw new Error("Email is required.");
  if (!password) throw new Error("Password is required.");
  if (password.length < 8) throw new Error("Password must be at least 8 characters.");
  if (!normalizedName) throw new Error("Name is required.");

  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: { data: { name: normalizedName } },
  });

  if (error) {
    if (error.code === "user_already_exists" || /already registered|already exists/i.test(error.message || "")) {
      throw new Error("An account with this email already exists. Please sign in instead.");
    }
    throw error;
  }

  if (!data.session) {
    throw new Error("Account created. Please confirm your email before signing in.");
  }

  return mapUser(data.user);
}

export async function loginCustomer(email, password) {
  const normalizedEmail = String(email || "").trim();
  if (!normalizedEmail) throw new Error("Email is required.");
  if (!password) throw new Error("Password is required.");

  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });
  if (error) throw error;
  return mapUser(data.user);
}

export async function logoutCustomer() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  return true;
}

export async function updateCustomerProfile({ name }) {
  const normalizedName = String(name || "").trim();
  if (!normalizedName) throw new Error("Name is required.");
  if (normalizedName.length > 128) throw new Error("Name must be 128 characters or fewer.");

  const { data, error } = await supabase.auth.updateUser({
    data: { name: normalizedName },
  });
  if (error) throw error;
  return mapUser(data.user);
}
