import { Query } from "appwrite";

import { account, teams } from "../utils/appwrite";

const MANAGEMENT_TEAM_ID =
  import.meta.env.VITE_APPWRITE_MANAGEMENT_TEAM_ID;

export const MANAGEMENT_ROLES = {
  OWNER: "owner",
  MANAGER: "manager",
  STAFF: "staff",
};

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

  // First check the teams belonging to the current user.
  // This avoids querying the membership list for users
  // who are not members of the management team.
  const teamResponse = await teams.list({
    total: false,
  });

  const managementTeam = teamResponse.teams?.find(
    (team) => team.$id === MANAGEMENT_TEAM_ID
  );

  if (!managementTeam) {
    return {
      isMember: false,
      roles: [],
      membership: null,
    };
  }

  // The user is a member of the management team,
  // so we can now retrieve the membership and its roles.
  const membershipResponse = await teams.listMemberships({
    teamId: MANAGEMENT_TEAM_ID,
    queries: [
      Query.equal("userId", user.$id),
    ],
    total: false,
  });

  const membership =
    membershipResponse.memberships?.find(
      (item) =>
        item.userId === user.$id &&
        item.confirm === true
    ) || null;

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