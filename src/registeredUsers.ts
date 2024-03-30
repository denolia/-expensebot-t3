import fs from "fs";
import { Username } from "./types";

const REGISTERED_USERS_FILE = "./registered-users.json";
export let registeredUsers: Username[] = [];

export function loadRegisteredUsers() {
  if (!fs.existsSync(REGISTERED_USERS_FILE)) {
    throw new Error("Please provide a registered-users.json file");
  } else {
    const data = fs.readFileSync(REGISTERED_USERS_FILE, "utf8");
    registeredUsers = JSON.parse(data).users;
  }
}
