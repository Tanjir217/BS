export const BACKEND_PROVIDERS = { APPWRITE: "appwrite", SUPABASE: "supabase" };

export function getBackendProvider() {
  const provider = String(import.meta.env.VITE_BACKEND_PROVIDER || BACKEND_PROVIDERS.APPWRITE).toLowerCase();
  if (!Object.values(BACKEND_PROVIDERS).includes(provider)) throw new Error(`Unsupported backend provider: ${provider}`);
  return provider;
}

export function isProductionBackendReady() {
  return getBackendProvider() === BACKEND_PROVIDERS.SUPABASE
    ? Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY)
    : Boolean(import.meta.env.VITE_APPWRITE_URL && import.meta.env.VITE_APPWRITE_DATABASE_ID);
}
