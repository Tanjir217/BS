import { account } from "../utils/appwrite";

export async function getCurrentUser() {
  try {
    return await account.get();
  } catch (error) {
    if (error?.code === 401) {
      return null;
    }

    throw error;
  }
}

export async function loginAdmin(
  email,
  password
) {
  const normalizedEmail =
    String(email || "").trim();

  if (!normalizedEmail) {
    throw new Error(
      "Email is required."
    );
  }

  if (!password) {
    throw new Error(
      "Password is required."
    );
  }

  return account.createEmailPasswordSession({
    userId: normalizedEmail,
    password,
  });
}

export async function logoutAdmin() {
  return account.deleteSession({
    sessionId: "current",
  });
}