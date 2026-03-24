"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { createAdminAction, updateAdminAction } from "@/app/actions";
import type { AdminUser } from "@/lib/api";

type State = { error?: string; success?: boolean };
const initialState: State = {};

export function AdminForm({
  admin,
  onClose
}: {
  admin?: AdminUser;
  onClose: () => void;
}) {
  const isEdit = Boolean(admin);
  const router = useRouter();
  const prevSuccess = useRef(false);

  const [state, formAction, isPending] = useActionState(
    async (_prev: State, formData: FormData): Promise<State> => {
      const action = isEdit ? updateAdminAction : createAdminAction;
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
      {isEdit && <input type="hidden" name="adminId" value={admin!.id} />}

      <div className="form-row">
        <label className="agent-field">
          <span>Full Name</span>
          <input name="name" type="text" defaultValue={admin?.name ?? ""} required />
        </label>
        <label className="agent-field">
          <span>Email</span>
          <input name="email" type="email" defaultValue={admin?.email ?? ""} required />
        </label>
      </div>

      <div className="form-row">
        <label className="agent-field">
          <span>Role</span>
          <select name="role" defaultValue={admin?.role ?? "staff"}>
            <option value="owner">Owner</option>
            <option value="manager">Manager</option>
            <option value="staff">Staff</option>
          </select>
        </label>
        <label className="agent-field">
          <span>{isEdit ? "New Password (leave empty to keep)" : "Password"}</span>
          <input
            name="password"
            type="password"
            defaultValue=""
            {...(isEdit ? {} : { required: true })}
            minLength={4}
          />
        </label>
      </div>

      {isEdit && (
        <div className="form-row">
          <label className="checkbox-field">
            <input name="isActive" type="checkbox" defaultChecked={admin?.isActive ?? true} />
            <span>Active</span>
          </label>
        </div>
      )}

      {state.error ? <p className="agent-error">{state.error}</p> : null}
      {state.success ? <p style={{ color: "var(--green-text)", fontWeight: 600 }}>Admin saved successfully.</p> : null}

      <div style={{ display: "flex", gap: "var(--sp-3)" }}>
        <button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : isEdit ? "Update Admin" : "Create Admin"}
        </button>
        <button type="button" className="agent-secondary-button" onClick={onClose}>
          Cancel
        </button>
      </div>
    </form>
  );
}
