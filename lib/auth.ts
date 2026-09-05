import "server-only";
import { cookies, headers } from "next/headers";

export type UserRole = "staff" | "admin";

const COOKIE_NAME = "pos_session_role";

export async function setSessionRoleCookie(role: UserRole) {
  const cookieStore = await cookies();
  let isSecure = process.env.NODE_ENV === "production";
  try {
    const headerStore = await headers();
    const proto = headerStore.get("x-forwarded-proto");
    const host = headerStore.get("host") || "";
    if (
      proto === "http" ||
      host.startsWith("localhost") ||
      host.startsWith("127.0.0.1") ||
      /^192\.168\./.test(host) ||
      /^10\./.test(host)
    ) {
      isSecure = false;
    }
  } catch {
    // Keep isSecure as is
  }
  cookieStore.set(COOKIE_NAME, role, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSessionRoleCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSessionRole(): Promise<UserRole | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  if (!cookie || !cookie.value) return null;
  if (cookie.value === "admin" || cookie.value === "staff") {
    return cookie.value as UserRole;
  }
  return null;
}

export async function requireStaff(): Promise<UserRole> {
  const role = await getSessionRole();
  if (!role) {
    // If dev or fallback, permit if env is missing or in relaxed dev mode
    if (process.env.NODE_ENV === "development") {
      return "staff";
    }
    throw new Error("Unauthorized: Staff or Admin role required");
  }
  return role;
}

export async function requireAdmin(): Promise<UserRole> {
  const role = await getSessionRole();
  if (role !== "admin") {
    if (process.env.NODE_ENV === "development") {
      return "admin";
    }
    throw new Error("Unauthorized: Admin role required");
  }
  return "admin";
}
