import { Permission, Role } from "appwrite";
import { account } from "../utils/appwrite";
import {
  createCustomer,
  getCustomerById,
} from "./customerServices";


async function ensureCustomerProfile(user) {
  if (!user?.$id) {
    throw new Error("Unable to determine the customer account ID.");
  }

  const existingById = await getCustomerById(user.$id);
  if (existingById) {
    return existingById;
  }

  const nameParts = String(user.name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const firstName = nameParts.shift() || "Customer";
  const lastName = nameParts.join(" ");

  return createCustomer({
    rowId: user.$id,
    account_ID: user.$id,
    first_Name: firstName,
    last_Name: lastName,
    email: user.email || "",
    phone: "",
    permissions: [Permission.read(Role.user(user.$id))],
  });
}

export async function updateCustomerProfile({
  name,
}) {
  const normalizedName =
    String(name || "").trim();

  if (!normalizedName) {
    throw new Error(
      "Name is required.",
    );
  }

  if (normalizedName.length > 128) {
    throw new Error(
      "Name must be 128 characters or fewer.",
    );
  }

  return await account.updateName({
    name: normalizedName,
  });
}



export async function getCurrentCustomer() {
  try {
    const user = await account.get();
    await ensureCustomerProfile(user);
    return user;
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

  await account.create({
    userId: "unique()",
    email: normalizedEmail,
    password,
    name: normalizedName,
  });

  await account.createEmailPasswordSession({
    email: normalizedEmail,
    password,
  });

  const user = await account.get();
  await ensureCustomerProfile(user);

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

  await account.createEmailPasswordSession({
    email: normalizedEmail,
    password,
  });

  return await account.get();
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