"use client";

import { useState } from "react";
import { deactivateAdminAction, activateAdminAction } from "@/app/actions";
import { useRouter } from "next/navigation";
import type { AdminUser } from "@/lib/api";
import { AdminForm } from "./admin-form";

function roleLabel(role: string) {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function AdminsActions({ admins }: { admins: AdminUser[] }) {
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const router = useRouter();

  async function handleToggleActive(id: string, name: string, currentlyActive: boolean) {
    const action = currentlyActive ? "Deactivate" : "Activate";
    const msg = currentlyActive
      ? `Deactivate admin "${name}"? They will no longer be able to log in.`
      : `Activate admin "${name}"? They will be able to log in again.`;
    if (!confirm(msg)) return;
    setToggling(id);
    setToggleError(null);
    try {
      const formData = new FormData();
      formData.set("adminId", id);
      const result = currentlyActive
        ? await deactivateAdminAction(formData)
        : await activateAdminAction(formData);
      if (result.error) {
        setToggleError(result.error);
      } else {
        router.refresh();
      }
    } catch {
      setToggleError(`Failed to ${action.toLowerCase()} admin.`);
    } finally {
      setToggling(null);
    }
  }

  return (
    <>
      <section className="panel">
        <div className="section-heading">
          <h2>All Admins ({admins.length})</h2>
          <button
            type="button"
            className="agent-secondary-button"
            onClick={() => { setShowCreate(!showCreate); setEditingId(null); }}
          >
            {showCreate ? "Close" : "Add Admin"}
          </button>
        </div>

        {showCreate && (
          <div style={{ marginBottom: "var(--sp-5)" }}>
            <AdminForm onClose={() => setShowCreate(false)} />
          </div>
        )}

        {toggleError && <p className="agent-error">{toggleError}</p>}
      </section>

      <section className="card-grid">
        {admins.map((admin) => (
          <article key={admin.id} className="panel resource-card">
            {editingId === admin.id ? (
              <>
                <p className="eyebrow">Editing Admin</p>
                <AdminForm
                  key={`${admin.id}-${admin.role}-${admin.isActive}`}
                  admin={admin}
                  onClose={() => setEditingId(null)}
                />
              </>
            ) : (
              <>
                <div className="resource-card__header">
                  <div>
                    <p className="eyebrow">{roleLabel(admin.role)}</p>
                    <h2>{admin.name}</h2>
                    <p className="muted" style={{ fontSize: "var(--text-sm)", marginTop: "2px" }}>{admin.email}</p>
                  </div>
                  <span className={`badge badge--${admin.isActive ? "success" : "neutral"}`}>
                    {admin.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <dl className="detail-list compact">
                  <div>
                    <dt>Role</dt>
                    <dd>{roleLabel(admin.role)}</dd>
                  </div>
                  <div>
                    <dt>Joined</dt>
                    <dd>{new Date(admin.createdAt).toLocaleDateString()}</dd>
                  </div>
                </dl>
                <div style={{ display: "flex", gap: "var(--sp-3)", marginTop: "var(--sp-3)" }}>
                  <button
                    type="button"
                    className="agent-secondary-button"
                    onClick={() => { setEditingId(admin.id); setShowCreate(false); }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="agent-secondary-button"
                    style={{ color: admin.isActive ? "var(--red-text)" : "var(--green-text)" }}
                    disabled={toggling === admin.id}
                    onClick={() => handleToggleActive(admin.id, admin.name, admin.isActive)}
                  >
                    {toggling === admin.id
                      ? (admin.isActive ? "Deactivating..." : "Activating...")
                      : (admin.isActive ? "Deactivate" : "Activate")}
                  </button>
                </div>
              </>
            )}
          </article>
        ))}
      </section>
    </>
  );
}
