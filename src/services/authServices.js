import { Query } from "appwrite";

import { account, teams } from "../utils/appwrite";

const MANAGEMENT_TEAM_ID =
  import.meta.env.VITE_APPWRITE_MANAGEMENT_TEAM_ID;


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

export async function loginAdmin(email, password) {
  const normalizedEmail = String(email || "").trim();

  if (!normalizedEmail) {
    throw new Error("Email is required.");
  }

  if (!password) {
    throw new Error("Password is required.");
  }

  if (!MANAGEMENT_TEAM_ID) {
    throw new Error(
      "Management team is not configured."
    );
  }

  return account.createEmailPasswordSession({
    email: normalizedEmail,
    password,
  });
}

export async function logoutAdmin() {
  return account.deleteSession({
    sessionId: "current",
  });
}

export async function getManagementAccess(user) {
  if (!user?.$id) {
    return {
      isMember: false,
      roles: [],
      membership: null,
    };
  }

  if (!MANAGEMENT_TEAM_ID) {
    throw new Error(
      "VITE_APPWRITE_MANAGEMENT_TEAM_ID is not configured."
    );
  }

  /*
   * Verify that the configured team actually exists
   * and that the authenticated user can access it.
   */
  await teams.get({
    teamId: MANAGEMENT_TEAM_ID,
  });

  /*
   * Ask Appwrite directly for this user's membership
   * in the management team.
   */
  const membershipResponse =
    await teams.listMemberships({
      teamId: MANAGEMENT_TEAM_ID,
      queries: [
        Query.equal("userId", user.$id),
        Query.equal("confirm", true),
      ],
      total: false,
    });

  const membership =
    membershipResponse.memberships?.[0] || null;

  if (!membership) {
    return {
      isMember: false,
      roles: [],
      membership: null,
    };
  }

  return {
    isMember: true,
    roles: membership.roles || [],
    membership,
  };
}