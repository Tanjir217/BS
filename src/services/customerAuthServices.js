import { Permission, Role } from "appwrite";
import { account } from "../utils/appwrite";
import { createCustomer, getCustomerById } from "./customerServices";

async function ensureCustomerProfile(user) {
  if (!user?.$id) {
    throw new Error("Unable to determine the customer account ID.");
  }

  const existingCustomer = await getCustomerById(user.$id);

  if (existingCustomer) {
    return existingCustomer;
  }

  const nameParts = String(user.name || "Customer")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const firstName = nameParts.shift() || "Customer";
  const lastName = nameParts.join(" ");

  try {
    return await createCustomer({
      rowId: user.$id,
      account_ID: user.$id,
      first_Name: firstName,
      last_Name: lastName,
      email: user.email || "",
      phone: "",
      permissions: [
        Permission.read(Role.user(user.$id)),
      ],
    });
  } catch (error) {
    // If two auth/profile requests race, the second request can see
    // the row immediately after the first request creates it.
    if (error?.code === 409) {
      const customer = await getCustomerById(user.$id);

      if (customer) {
        return customer;
      }
    }

    if (error?.code === 401 || error?.code === 403) {
      throw new Error(
        "Your account was created, but the customer profile could not be saved. " +
        "In Appwrite, enable Row Security on the customers table and grant the Users role CREATE permission only.",
      );
    }

    throw error;
  }
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
    // Authentication initialization must only ask Appwrite whether a
    // session exists. It must not depend on the customer-profile
    // synchronization Function being deployed correctly.
    //
    // Profile synchronization is performed immediately after an
    // explicit sign-in/sign-up, where an actionable error can be shown
    // to the user instead of turning every page load into an auth error.
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

  try {
    await account.create({
      userId: "unique()",
      email: normalizedEmail,
      password,
      name: normalizedName,
    });
  } catch (error) {
    if (
      error?.code === 409 ||
      error?.type === "user_already_exists" ||
      error?.type === "user_email_already_exists" ||
      error?.type === "user_phone_already_exists"
    ) {
      throw new Error(
        "An account with this email already exists. Please sign in instead.",
      );
    }

    throw error;
  }

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

  const user = await account.get();
  await ensureCustomerProfile(user);

  return user;
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