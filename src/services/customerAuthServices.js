import { account, functions } from "../utils/appwrite";

async function ensureCustomerProfile(user) {
  if (!user?.$id) {
    throw new Error("Unable to determine the customer account ID.");
  }

  const functionId = import.meta.env.VITE_APPWRITE_MANAGE_ORDER_FUNCTION_ID;

  if (!functionId) {
    throw new Error("Customer profile service is not configured.");
  }

  const execution = await functions.createExecution({
    functionId,
    body: JSON.stringify({
      action: "ensure_customer_profile",
      name: user.name || "Customer",
      email: user.email || "",
    }),
    async: false,
    path: "/",
    method: "POST",
  });

  let response;

  try {
    response = JSON.parse(execution.responseBody || "{}");
  } catch {
    throw new Error("The customer profile service returned an invalid response.");
  }

  if (!response.success || !response.customer) {
    throw new Error(response.error || "Unable to create your customer profile.");
  }

  return response.customer;
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