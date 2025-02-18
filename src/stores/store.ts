import type { Config, User } from "@/types/types";

export function saveConfig(config: Config) {
  localStorage.setItem("config", JSON.stringify(config));
}

export function getConfig(): Config {
  const config = localStorage.getItem("config");
  if (config) {
    return JSON.parse(config);
  }
  return { darkMode: false };
}

export function saveUser(user: User) {
  sessionStorage.setItem("user", JSON.stringify(user));
}

export function getUser(): User | null {
  const user = sessionStorage.getItem("user");
  if (user) {
    return JSON.parse(user);
  }
  return null;
}
