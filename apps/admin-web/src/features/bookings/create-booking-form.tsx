"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBookingAction, checkAvailabilityAction } from "@/app/actions";
import type { Court, Customer } from "@/lib/api";

type AvailabilityResult = {
  available?: boolean;
  options?: Array<{ courtId: string; courtName: string; price: number }>;
  error?: string;
};

export function CreateBookingForm({
  courts,
  customers,
  onClose
}: {
  courts: Court[];
  customers: Customer[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [availability, setAvailability] = useState<AvailabilityResult | null>(null);
  const [customerMode, setCustomerMode] = useState<"existing" | "new">("existing");

  const activeCourts = courts.filter((c) => c.isActive);

  async function handleCheckAvailability(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setChecking(true);
    setAvailability(null);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await checkAvailabilityAction(formData);

    if (result.error) {
      setAvailability({ error: result.error });
    } else {
      setAvailability({ available: result.available, options: result.options });
    }
    setChecking(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await createBookingAction(formData);

    if (result.error) {
      setError(result.error);
      setSubmitting(false);
    } else {
      setSuccess(true);
      setTimeout(() => {
        router.refresh();
        if (result.bookingId) {
          router.push(`/bookings/${result.bookingId}`);
        }
        onClose();
      }, 1000);
    }
  }

  return (
    <form
      className="management-form"
      onSubmit={(e) => {
        const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        if (submitter?.value === "check") {
          handleCheckAvailability(e);
        } else {
          handleSubmit(e);
        }
      }}
    >
      {/* Customer Selection */}
      <div className="form-row">
        <label className="agent-field">
          <span>Customer</span>
          <select
            onChange={(e) => setCustomerMode(e.target.value as "existing" | "new")}
            value={customerMode}
          >
            <option value="existing">Existing Customer</option>
            <option value="new">New Customer (by phone)</option>
          </select>
        </label>
      </div>

      {customerMode === "existing" ? (
        <label className="agent-field">
          <span>Select Customer</span>
          <select name="customerId" required>
            <option value="">Choose a customer...</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name ?? "Unknown"} — {c.phone}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <div className="form-row">
          <label className="agent-field">
            <span>Phone Number</span>
            <input name="phone" type="tel" placeholder="+962790000000" required />
          </label>
          <label className="agent-field">
            <span>Customer Name (optional)</span>
            <input name="customerName" type="text" placeholder="Full name" />
          </label>
        </div>
      )}

      {/* Court & Booking Details */}
      <div className="form-row">
        <label className="agent-field">
          <span>Court</span>
          <select name="courtId" required>
            {activeCourts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.type}) — {Number(c.hourlyRate).toFixed(0)} JOD/hr
              </option>
            ))}
          </select>
        </label>
        <label className="agent-field">
          <span>Booking Type</span>
          <select name="bookingType" defaultValue="regular">
            <option value="regular">Regular</option>
            <option value="birthday">Birthday</option>
            <option value="private_event">Private Event</option>
          </select>
        </label>
      </div>

      <div className="form-row">
        <label className="agent-field">
          <span>Date &amp; Time</span>
          <input name="startTime" type="datetime-local" required />
        </label>
        <label className="agent-field">
          <span>Duration (mins)</span>
          <select name="durationMins" defaultValue="60">
            <option value="60">60 mins</option>
            <option value="90">90 mins</option>
            <option value="120">120 mins</option>
            <option value="180">180 mins</option>
          </select>
        </label>
      </div>

      {/* Availability Result */}
      {availability && (
        <div style={{ padding: "var(--sp-3)", borderRadius: "var(--radius-md)", background: "var(--surface-raised)", marginBottom: "var(--sp-3)" }}>
          {availability.error && (
            <p style={{ color: "var(--red-text)", fontWeight: 600 }}>{availability.error}</p>
          )}
          {availability.available === true && (
            <p style={{ color: "var(--green-text)", fontWeight: 600 }}>Slot is available!</p>
          )}
          {availability.available === false && (
            <p style={{ color: "var(--red-text)", fontWeight: 600 }}>Slot is not available. Please choose a different time or court.</p>
          )}
          {availability.options && availability.options.length > 0 && (
            <div style={{ marginTop: "var(--sp-2)" }}>
              <p className="muted" style={{ fontSize: "var(--text-sm)" }}>Available options:</p>
              {availability.options.map((opt, i) => (
                <p key={i} style={{ fontSize: "var(--text-sm)", marginTop: "2px" }}>
                  {opt.courtName} — {Number(opt.price).toFixed(0)} JOD
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {error && <p className="agent-error">{error}</p>}
      {success && <p style={{ color: "var(--green-text)", fontWeight: 600 }}>Booking created successfully! Redirecting...</p>}

      <div style={{ display: "flex", gap: "var(--sp-3)" }}>
        <button type="submit" name="action" value="check" disabled={checking} className="agent-secondary-button">
          {checking ? "Checking..." : "Check Availability"}
        </button>
        <button type="submit" name="action" value="create" disabled={submitting}>
          {submitting ? "Creating..." : "Create Booking"}
        </button>
        <button type="button" className="agent-secondary-button" onClick={onClose}>
          Cancel
        </button>
      </div>
    </form>
  );
}
