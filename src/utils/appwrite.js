// Compatibility facade during the Supabase migration.
// No Appwrite network/API calls are made from this module.
export {
  supabase,
  tablesDB,
  account,
  teams,
  storage,
  functions,
} from "./supabase";
