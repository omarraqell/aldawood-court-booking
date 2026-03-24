"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { rescheduleBookingAction } from "@/app/actions";
import type { Court } from "@/lib/api";

type State = { error?: string; success?: boolean };

const initialState: State = {};

export function RescheduleForm({
  bookingId,
  currentStart,
  currentDuration,
  currentCourtId,
  courts
}: {
  bookingId: string;
  currentStart: string;
  currentDuration: number;
  currentCourtId: string;
  courts: Court[];
}) {
  const router = useRouter();
  const prevSuccess = useRef(false);

  const [state, formAction, isPending] = useActionState(
    async (_prev: State, formData: FormData): Promise<State> => {
      const result = await rescheduleBookingAction(formData);
      if (result.error) return { error: result.error };
      return { success: true };
    },
    initialState
  );

  // On success: refresh the page to pull fresh server data (fixes court dropdown + shows updated values)
  useEffect(() => {
    if (state.success && !prevSuccess.current) {
      prevSuccess.current = true;
      const timer = setTimeout(() => {
        router.refresh();
        prevSuccess.current = false;
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [state.success, router]);

  return (
    <form action={formAction} className="management-form">
      <input type="hidden" name="bookingId" value={bookingId} />
      <label className="agent-field">
        <span>Start time</span>
        <input
          name="startTime"
          type="datetime-local"
          defaultValue={toDateTimeLocalValue(currentStart)}
          required
        />
      </label>
      <label className="agent-field">
        <span>Duration (mins)</span>
        <input
          name="durationMins"
          type="number"
          min={60}
          step={30}
          defaultValue={currentDuration}
          required
        />
      </label>
      <label className="agent-field">
        <span>Court</span>
        <select name="courtId" defaultValue={currentCourtId}>
          {courts.map((court) => (
            <option key={court.id} value={court.id}>
              {court.name} · {court.type}
            </option>
          ))}
        </select>
      </label>
      {state.error ? (
        <p className="agent-error">{state.error}</p>
      ) : null}
      {state.success ? (
        <p style={{ color: "var(--green-text)", fontWeight: 600 }}>
          Booking rescheduled successfully.
        </p>
      ) : null}
      <button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save reschedule"}
      </button>
    </form>
  );
}

function toDateTimeLocalValue(value: string) {
  const date = new Date(value);
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return shifted.toISOString().slice(0, 16);
}
