import { cookies } from "next/headers";
import { ADMIN_TOKEN_COOKIE, ADMIN_USER_COOKIE } from "@/lib/session-constants";

export type AdminSession = {
  token: string;
  admin: {
    id: string;
    email: string;
    name: string;
    role: "owner" | "manager" | "staff";
  };
};

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_TOKEN_COOKIE)?.value;
  const rawAdmin = cookieStore.get(ADMIN_USER_COOKIE)?.value;

  if (!token || !rawAdmin) {
    return null;
  }

  try {
    return {
      token,
      admin: JSON.parse(rawAdmin) as AdminSession["admin"]
    };
  } catch {
    return null;
  }
}
