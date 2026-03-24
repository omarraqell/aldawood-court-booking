"use client";

import { useState } from "react";
import type { Court, Customer } from "@/lib/api";
import { CreateBookingForm } from "./create-booking-form";

export function BookingsHeader({ courts, customers }: { courts: Court[]; customers: Customer[] }) {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <section className="panel">
      <div className="section-heading">
        <h2>Actions</h2>
        <button
          type="button"
          className="agent-secondary-button"
          onClick={() => setShowCreate(!showCreate)}
        >
          {showCreate ? "Close" : "New Booking"}
        </button>
      </div>

      {showCreate && (
        <div style={{ marginTop: "var(--sp-3)" }}>
          <CreateBookingForm
            courts={courts}
            customers={customers}
            onClose={() => setShowCreate(false)}
          />
        </div>
      )}
    </section>
  );
}
