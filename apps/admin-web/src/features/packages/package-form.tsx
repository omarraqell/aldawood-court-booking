"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { createPackageAction, updatePackageAction } from "@/app/actions";
import type { EventPackage } from "@/lib/api";

type State = { error?: string; success?: boolean };
const initialState: State = {};

export function PackageForm({
  pkg,
  onClose
}: {
  pkg?: EventPackage;
  onClose: () => void;
}) {
  const isEdit = Boolean(pkg);
  const router = useRouter();
  const prevSuccess = useRef(false);

  const [state, formAction, isPending] = useActionState(
    async (_prev: State, formData: FormData): Promise<State> => {
      const action = isEdit ? updatePackageAction : createPackageAction;
      const result = await action(formData);
      if (result.error) return { error: result.error };
      return { success: true };
    },
    initialState
  );

  useEffect(() => {
    if (state.success && !prevSuccess.current) {
      prevSuccess.current = true;
      const timer = setTimeout(() => {
        router.refresh();
        onClose();
        prevSuccess.current = false;
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [state.success, router, onClose]);

  return (
    <form action={formAction} className="management-form">
      {isEdit && <input type="hidden" name="packageId" value={pkg!.id} />}

      <div className="form-row">
        <label className="agent-field">
          <span>Name (English)</span>
          <input name="name" type="text" defaultValue={pkg?.name ?? ""} required />
        </label>
        <label className="agent-field">
          <span>Name (Arabic)</span>
          <input name="nameAr" type="text" defaultValue={pkg?.nameAr ?? ""} required />
        </label>
      </div>

      <div className="form-row">
        <label className="agent-field">
          <span>Type</span>
          <select name="type" defaultValue={pkg?.type ?? "private_event"}>
            <option value="birthday">Birthday</option>
            <option value="corporate">Corporate</option>
            <option value="tournament">Tournament</option>
            <option value="private_event">Private Event</option>
          </select>
        </label>
        <label className="agent-field">
          <span>Base Price (JOD)</span>
          <input name="basePrice" type="number" min={0} step={1} defaultValue={pkg?.basePrice ?? ""} required />
        </label>
      </div>

      <div className="form-row">
        <label className="agent-field">
          <span>Duration (mins)</span>
          <input name="durationMins" type="number" min={30} step={30} defaultValue={pkg?.durationMins ?? 60} required />
        </label>
        <label className="agent-field">
          <span>Max Guests</span>
          <input name="maxGuests" type="number" min={1} defaultValue={pkg?.maxGuests ?? ""} placeholder="Leave empty for flexible" />
        </label>
      </div>

      <label className="agent-field">
        <span>Description (English)</span>
        <input name="description" type="text" defaultValue={pkg?.description ?? ""} />
      </label>
      <label className="agent-field">
        <span>Description (Arabic)</span>
        <input name="descriptionAr" type="text" defaultValue={pkg?.descriptionAr ?? ""} />
      </label>

      <div className="form-row">
        <label className="checkbox-field">
          <input name="includesDecorations" type="checkbox" defaultChecked={pkg?.includesDecorations ?? false} />
          <span>Includes Decorations</span>
        </label>
        <label className="checkbox-field">
          <input name="includesCatering" type="checkbox" defaultChecked={pkg?.includesCatering ?? false} />
          <span>Includes Catering</span>
        </label>
        {isEdit && (
          <label className="checkbox-field">
            <input name="isActive" type="checkbox" defaultChecked={pkg?.isActive ?? true} />
            <span>Active</span>
          </label>
        )}
      </div>

      {state.error ? <p className="agent-error">{state.error}</p> : null}
      {state.success ? <p style={{ color: "var(--green-text)", fontWeight: 600 }}>Package saved successfully.</p> : null}

      <div style={{ display: "flex", gap: "var(--sp-3)" }}>
        <button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : isEdit ? "Update Package" : "Create Package"}
        </button>
        <button type="button" className="agent-secondary-button" onClick={onClose}>
          Cancel
        </button>
      </div>
    </form>
  );
}
