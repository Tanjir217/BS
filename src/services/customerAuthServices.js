import { account } from "../utils/appwrite";

export async function getCurrentCustomer() {
  try {
    return await account.get();
  } catch (error) {
    if (error?.code === 401) {
      return null;
    }

    throw error;
  }
}

export async function registerCustomer({
  email,
  password,
  name,
}) {
  const normalizedEmail =
    String(email || "").trim();

  const normalizedName =
    String(name || "").trim();

  if (!normalizedEmail) {
    throw new Error(
      "Email is required.",
    );
  }

  if (!password) {
    throw new Error(
      "Password is required.",
    );
  }

  if (password.length < 8) {
    throw new Error(
      "Password must be at least 8 characters.",
    );
  }

  if (!normalizedName) {
    throw new Error(
      "Name is required.",
    );
  }

  const user = await account.create({
    userId: "unique()",
    email: normalizedEmail,
    password,
    name: normalizedName,
  });

  await account.createEmailPasswordSession({
    email: normalizedEmail,
    password,
  });

  return user;
}

export async function loginCustomer(
  email,
  password,
) {
  const normalizedEmail =
    String(email || "").trim();

  if (!normalizedEmail) {
    throw new Error(
      "Email is required.",
    );
  }

  if (!password) {
    throw new Error(
      "Password is required.",
    );
  }

  return account.createEmailPasswordSession({
    email: normalizedEmail,
    password,
  });
}

export async function logoutCustomer() {
  try {
    return await account.deleteSession({
      sessionId: "current",
    });
  } catch (error) {
    if (error?.code === 401) {
      return null;
    }

    throw error;
  }
}