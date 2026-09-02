import { Client, Account, TablesDB, Storage } from "appwrite";
console.log("Endpoint:", import.meta.env.VITE_APPWRITE_ENDPOINT);
console.log("Project:", import.meta.env.VITE_APPWRITE_PROJECT_ID);
console.log("Database:", import.meta.env.VITE_APPWRITE_DATABASE_ID);
const client = new Client();

client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const tablesDB = new TablesDB(client);
export const storage = new Storage(client);


