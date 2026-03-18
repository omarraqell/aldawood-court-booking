"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/session";
import { ADMIN_TOKEN_COOKIE, ADMIN_USER_COOKIE } from "@/lib/session-constants";

const apiBaseUrl = process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:4000/api";

async function apiRequest(path: string, init: RequestInit = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init.headers ?? {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `${response.status} ${response.statusText}`);
  }

  return response;
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  try {
    const response = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    const payload = (await response.json()) as {
      token: string;
      admin: { id: string; email: string; name: string; role: "owner" | "manager" | "staff" };
    };

    const cookieStore = await cookies();
    cookieStore.set(ADMIN_TOKEN_COOKIE, payload.token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/"
    });
    cookieStore.set(ADMIN_USER_COOKIE, JSON.stringify(payload.admin), {
      httpOnly: true,
      sameSite: "lax",
      path: "/"
    });
  } catch {
    redirect("/login?error=invalid");
  }

  redirect("/");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_TOKEN_COOKIE);
  cookieStore.delete(ADMIN_USER_COOKIE);
  redirect("/login");
}

export async function updatePolicyAction(formData: FormData) {
  const session = await requireSession();

  await apiRequest("/policies", {
    method: "PATCH",
    body: JSON.stringify({
      actorAdminId: session.admin.id,
      timezone: String(formData.get("timezone") ?? "Asia/Amman"),
      slotIntervalMins: Number(formData.get("slotIntervalMins") ?? 60),
      minBookingDurationMins: Number(formData.get("minBookingDurationMins") ?? 60),
      maxBookingDurationMins: Number(formData.get("maxBookingDurationMins") ?? 180),
      minLeadTimeMins: Number(formData.get("minLeadTimeMins") ?? 120),
      cancellationCutoffMins: Number(formData.get("cancellationCutoffMins") ?? 180),
      modificationCutoffMins: Number(formData.get("modificationCutoffMins") ?? 180),
      openingTime: String(formData.get("openingTime") ?? "16:00"),
      closingTime: String(formData.get("closingTime") ?? "01:00")
    })
  });

  revalidatePath("/policies");
  revalidatePath("/");
}

export async function createCourtBlockAction(formData: FormData) {
  const session = await requireSession();

  await apiRequest("/court-unavailability", {
    method: "POST",
    body: JSON.stringify({
      createdByAdminId: session.admin.id,
      courtId: String(formData.get("courtId") ?? ""),
      reason: String(formData.get("reason") ?? "Unavailable"),
      startTime: String(formData.get("startTime") ?? ""),
      endTime: String(formData.get("endTime") ?? "")
    })
  });

  revalidatePath("/courts");
}

export async function createPricingRuleAction(formData: FormData) {
  const session = await requireSession();
  const courtId = String(formData.get("courtId") ?? "");

  await apiRequest(`/courts/${courtId}/pricing-rules`, {
    method: "POST",
    body: JSON.stringify({
      actorAdminId: session.admin.id,
      name: String(formData.get("name") ?? "Custom rule"),
      priority: Number(formData.get("priority") ?? 100),
      dayOfWeek: formData.get("dayOfWeek") ? Number(formData.get("dayOfWeek")) : null,
      startHour: Number(formData.get("startHour") ?? 16),
      endHour: Number(formData.get("endHour") ?? 17),
      price: Number(formData.get("price") ?? 0),
      isPeak: formData.get("isPeak") === "on"
    })
  });

  revalidatePath("/courts");
}

export async function cancelBookingAction(formData: FormData) {
  const session = await requireSession();
  const bookingId = String(formData.get("bookingId") ?? "");

  await apiRequest(`/bookings/${bookingId}/cancel`, {
    method: "POST",
    body: JSON.stringify({
      actorAdminId: session.admin.id,
      reason: String(formData.get("reason") ?? "Cancelled by admin")
    })
  });

  revalidatePath(`/bookings/${bookingId}`);
  revalidatePath("/bookings");
  revalidatePath("/");
}

export async function confirmBookingAction(formData: FormData) {
  const session = await requireSession();
  const bookingId = String(formData.get("bookingId") ?? "");

  await apiRequest(`/bookings/${bookingId}/confirm`, {
    method: "POST",
    body: JSON.stringify({ actorAdminId: session.admin.id })
  });

  revalidatePath(`/bookings/${bookingId}`);
  revalidatePath("/bookings");
  revalidatePath("/");
}

export async function rescheduleBookingAction(formData: FormData) {
  const session = await requireSession();
  const bookingId = String(formData.get("bookingId") ?? "");

  await apiRequest(`/bookings/${bookingId}`, {
    method: "PATCH",
    body: JSON.stringify({
      actorAdminId: session.admin.id,
      courtId: String(formData.get("courtId") ?? ""),
      startTime: String(formData.get("startTime") ?? ""),
      durationMins: Number(formData.get("durationMins") ?? 60)
    })
  });

  revalidatePath(`/bookings/${bookingId}`);
  revalidatePath("/bookings");
  revalidatePath("/");
}

async function requireSession() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}
