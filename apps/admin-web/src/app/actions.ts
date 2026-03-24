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

export async function rescheduleBookingAction(formData: FormData): Promise<{ error?: string }> {
  const session = await requireSession();
  const bookingId = String(formData.get("bookingId") ?? "");
  const rawStart = String(formData.get("startTime") ?? "");
  const durationMins = Number(formData.get("durationMins") ?? 60);

  // datetime-local gives "2026-03-25T16:00" — append Amman offset (+03:00)
  const startTime = rawStart.includes("+") || rawStart.includes("Z")
    ? rawStart
    : `${rawStart}:00+03:00`;

  // Calculate endTime from startTime + duration so the backend doesn't inherit the old endTime
  const startDate = new Date(startTime);
  const endDate = new Date(startDate.getTime() + durationMins * 60_000);
  const endTime = endDate.toISOString();

  try {
    await apiRequest(`/bookings/${bookingId}`, {
      method: "PATCH",
      body: JSON.stringify({
        actorAdminId: session.admin.id,
        courtId: String(formData.get("courtId") ?? ""),
        startTime,
        endTime,
        durationMins
      })
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Reschedule failed";
    try {
      const parsed = JSON.parse(message);
      return { error: parsed.message ?? message };
    } catch {
      return { error: message };
    }
  }

  revalidatePath(`/bookings/${bookingId}`);
  revalidatePath("/bookings");
  revalidatePath("/");
  return {};
}

export async function createPackageAction(formData: FormData): Promise<{ error?: string }> {
  await requireSession();

  try {
    await apiRequest("/event-packages", {
      method: "POST",
      body: JSON.stringify({
        name: String(formData.get("name") ?? ""),
        nameAr: String(formData.get("nameAr") ?? ""),
        type: String(formData.get("type") ?? "private_event"),
        description: String(formData.get("description") ?? "") || null,
        descriptionAr: String(formData.get("descriptionAr") ?? "") || null,
        basePrice: Number(formData.get("basePrice") ?? 0),
        maxGuests: formData.get("maxGuests") ? Number(formData.get("maxGuests")) : null,
        includesDecorations: formData.get("includesDecorations") === "on",
        includesCatering: formData.get("includesCatering") === "on",
        durationMins: Number(formData.get("durationMins") ?? 60),
        isActive: true
      })
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Create failed";
    try { return { error: JSON.parse(message).message ?? message }; } catch { return { error: message }; }
  }

  revalidatePath("/packages");
  revalidatePath("/");
  return {};
}

export async function updatePackageAction(formData: FormData): Promise<{ error?: string }> {
  await requireSession();
  const packageId = String(formData.get("packageId") ?? "");

  try {
    await apiRequest(`/event-packages/${packageId}`, {
      method: "PATCH",
      body: JSON.stringify({
        name: String(formData.get("name") ?? ""),
        nameAr: String(formData.get("nameAr") ?? ""),
        type: String(formData.get("type") ?? "private_event"),
        description: String(formData.get("description") ?? "") || null,
        descriptionAr: String(formData.get("descriptionAr") ?? "") || null,
        basePrice: Number(formData.get("basePrice") ?? 0),
        maxGuests: formData.get("maxGuests") ? Number(formData.get("maxGuests")) : null,
        includesDecorations: formData.get("includesDecorations") === "on",
        includesCatering: formData.get("includesCatering") === "on",
        durationMins: Number(formData.get("durationMins") ?? 60),
        isActive: formData.get("isActive") === "on"
      })
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Update failed";
    try { return { error: JSON.parse(message).message ?? message }; } catch { return { error: message }; }
  }

  revalidatePath("/packages");
  revalidatePath("/");
  return {};
}

export async function activatePackageAction(formData: FormData): Promise<{ error?: string }> {
  await requireSession();
  const packageId = String(formData.get("packageId") ?? "");

  try {
    await apiRequest(`/event-packages/${packageId}`, {
      method: "PATCH",
      body: JSON.stringify({ isActive: true })
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Activation failed";
    try { return { error: JSON.parse(message).message ?? message }; } catch { return { error: message }; }
  }

  revalidatePath("/packages");
  revalidatePath("/");
  return {};
}

export async function deletePackageAction(formData: FormData): Promise<{ error?: string }> {
  await requireSession();
  const packageId = String(formData.get("packageId") ?? "");

  try {
    await apiRequest(`/event-packages/${packageId}`, {
      method: "DELETE"
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Deactivation failed";
    try { return { error: JSON.parse(message).message ?? message }; } catch { return { error: message }; }
  }

  revalidatePath("/packages");
  revalidatePath("/");
  return {};
}

// ── Admin user actions ──

export async function createAdminAction(formData: FormData): Promise<{ error?: string }> {
  await requireSession();

  try {
    await apiRequest("/admins", {
      method: "POST",
      body: JSON.stringify({
        name: String(formData.get("name") ?? ""),
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
        role: String(formData.get("role") ?? "staff")
      })
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Create failed";
    try { return { error: JSON.parse(message).message ?? message }; } catch { return { error: message }; }
  }

  revalidatePath("/admins");
  revalidatePath("/");
  return {};
}

export async function updateAdminAction(formData: FormData): Promise<{ error?: string }> {
  await requireSession();
  const adminId = String(formData.get("adminId") ?? "");

  const payload: Record<string, unknown> = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    role: String(formData.get("role") ?? "staff"),
    isActive: formData.get("isActive") === "on"
  };

  const password = String(formData.get("password") ?? "");
  if (password.length > 0) {
    payload.password = password;
  }

  try {
    await apiRequest(`/admins/${adminId}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Update failed";
    try { return { error: JSON.parse(message).message ?? message }; } catch { return { error: message }; }
  }

  revalidatePath("/admins");
  revalidatePath("/");
  return {};
}

export async function deactivateAdminAction(formData: FormData): Promise<{ error?: string }> {
  await requireSession();
  const adminId = String(formData.get("adminId") ?? "");

  try {
    await apiRequest(`/admins/${adminId}`, {
      method: "DELETE"
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Deactivation failed";
    try { return { error: JSON.parse(message).message ?? message }; } catch { return { error: message }; }
  }

  revalidatePath("/admins");
  revalidatePath("/");
  return {};
}

export async function activateAdminAction(formData: FormData): Promise<{ error?: string }> {
  await requireSession();
  const adminId = String(formData.get("adminId") ?? "");

  try {
    await apiRequest(`/admins/${adminId}`, {
      method: "PATCH",
      body: JSON.stringify({ isActive: true })
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Activation failed";
    try { return { error: JSON.parse(message).message ?? message }; } catch { return { error: message }; }
  }

  revalidatePath("/admins");
  revalidatePath("/");
  return {};
}

async function requireSession() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}
