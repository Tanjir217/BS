import {
  Client,
  Account,
  TablesDB,
  Teams,
  Storage,
  Functions,
} from "appwrite";

const client = new Client();

const endpoint =
  import.meta.env.VITE_APPWRITE_ENDPOINT ||
  import.meta.env.VITE_APPWRITE_URL;

const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID;

if (endpoint && projectId) {
  client.setEndpoint(endpoint).setProject(projectId);
}

export const account = new Account(client);
export const tablesDB = new TablesDB(client);
export const storage = new Storage(client);
export const teams = new Teams(client);
export const functions = new Functions(client);
