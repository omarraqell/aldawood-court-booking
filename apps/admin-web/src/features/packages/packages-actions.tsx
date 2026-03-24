"use client";

import { useState } from "react";
import { deletePackageAction, activatePackageAction } from "@/app/actions";
import { useRouter } from "next/navigation";
import type { EventPackage } from "@/lib/api";
import { PackageForm } from "./package-form";

function formatCurrency(value: string | number | null | undefined) {
  if (value === null || value === undefined) return "Unavailable";
  return `${Number(value).toFixed(0)} JOD`;
}

function packageTypeLabel(type: string) {
  if (type === "private_event") return "Private Event";
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function PackagesActions({ packages }: { packages: EventPackage[] }) {
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const router = useRouter();

  async function handleToggleActive(id: string, name: string, currentlyActive: boolean) {
    const action = currentlyActive ? "Deactivate" : "Activate";
    const msg = currentlyActive
      ? `Deactivate package "${name}"? It will no longer be available for booking.`
      : `Activate package "${name}"? It will become available for booking.`;
    if (!confirm(msg)) return;
    setDeleting(id);
    setDeleteError(null);
    try {
      const formData = new FormData();
      formData.set("packageId", id);
      const result = currentlyActive
        ? await deletePackageAction(formData)
        : await activatePackageAction(formData);
      if (result.error) {
        setDeleteError(result.error);
      } else {
        router.refresh();
      }
    } catch {
      setDeleteError(`Failed to ${action.toLowerCase()} package.`);
    } finally {
      setDeleting(null);
    }
  }

  return (
    <>
      <section className="panel">
        <div className="section-heading">
          <h2>All Packages ({packages.length})</h2>
          <button
            type="button"
            className="agent-secondary-button"
            onClick={() => { setShowCreate(!showCreate); setEditingId(null); }}
          >
            {showCreate ? "Close" : "Add Package"}
          </button>
        </div>

        {showCreate && (
          <div style={{ marginBottom: "var(--sp-5)" }}>
            <PackageForm onClose={() => setShowCreate(false)} />
          </div>
        )}

        {deleteError && <p className="agent-error">{deleteError}</p>}
      </section>

      <section className="card-grid">
        {packages.map((pkg) => (
          <article key={pkg.id} className="panel resource-card">
            {editingId === pkg.id ? (
              <>
                <p className="eyebrow">Editing Package</p>
                <PackageForm
                  key={`${pkg.id}-${pkg.basePrice}-${pkg.isActive}`}
                  pkg={pkg}
                  onClose={() => setEditingId(null)}
                />
              </>
            ) : (
              <>
                <div className="resource-card__header">
                  <div>
                    <p className="eyebrow">{packageTypeLabel(pkg.type)}</p>
                    <h2>{pkg.name}</h2>
                    <p className="muted" style={{ fontSize: "var(--text-sm)", marginTop: "2px" }}>{pkg.nameAr}</p>
                  </div>
                  <span className={`badge badge--${pkg.isActive ? "success" : "neutral"}`}>
                    {pkg.isActive ? "Live" : "Offline"}
                  </span>
                </div>
                <p className="muted">{pkg.description ?? pkg.descriptionAr ?? "No description provided."}</p>
                <dl className="detail-list compact">
                  <div>
                    <dt>Base Price</dt>
                    <dd>{formatCurrency(pkg.basePrice)}</dd>
                  </div>
                  <div>
                    <dt>Duration</dt>
                    <dd>{pkg.durationMins} mins</dd>
                  </div>
                  <div>
                    <dt>Max Guests</dt>
                    <dd>{pkg.maxGuests ?? "Flexible"}</dd>
                  </div>
                </dl>
                <div className="meta-row">
                  <span>{pkg.includesDecorations ? "Decorations included" : "No decorations"}</span>
                  <span>{pkg.includesCatering ? "Catering included" : "No catering"}</span>
                </div>
                <div style={{ display: "flex", gap: "var(--sp-3)", marginTop: "var(--sp-3)" }}>
                  <button
                    type="button"
                    className="agent-secondary-button"
                    onClick={() => { setEditingId(pkg.id); setShowCreate(false); }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="agent-secondary-button"
                    style={{ color: pkg.isActive ? "var(--red-text)" : "var(--green-text)" }}
                    disabled={deleting === pkg.id}
                    onClick={() => handleToggleActive(pkg.id, pkg.name, pkg.isActive)}
                  >
                    {deleting === pkg.id
                      ? (pkg.isActive ? "Deactivating..." : "Activating...")
                      : (pkg.isActive ? "Deactivate" : "Activate")}
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
