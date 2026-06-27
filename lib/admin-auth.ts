const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "superadmin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "ALAI2025dmin@";
const SESSION_SECRET = process.env.SESSION_SECRET || "lai-secret-changeme";

export function validateCredentials(username: string, password: string): boolean {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

export function createSessionToken(): string {
  return Buffer.from(`${SESSION_SECRET}:${Date.now()}`).toString("base64url");
}

export function validateSessionToken(token: string | undefined): boolean {
  if (!token) return false;
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    return decoded.startsWith(SESSION_SECRET + ":");
  } catch {
    return false;
  }
}

export const SESSION_COOKIE = "lai_admin_token";
