import Link from "next/link";
import { createCourtBlockAction, createPricingRuleAction } from "@/app/actions";
import { getCourts } from "@/lib/api";
import { formatCurrency, formatDateTime, surfaceLabel } from "@/lib/format";

export async function CourtsOverview() {
  const response = await getCourts();

  return (
    <div className="grid">
      <section className="panel section-intro">
        <p className="eyebrow">Courts</p>
        <h1>Inventory and availability controls</h1>
        <p className="muted">
          Read-only operations view over resource pricing, court capabilities, and live blockouts.
        </p>
      </section>



      <section className="card-grid">
        {response.items.map((court) => (
          <div key={court.id} className="panel resource-card--simple">
            <div className="resource-card__image-placeholder">
              <span className="eyebrow">{court.type}</span>
            </div>
            
            <div className="resource-card__body">
              <div className="resource-card__title-row">
                <div>
                  <h2>{court.name}</h2>
                  <p className="small-brief">{court.nameAr}</p>
                </div>
                <span className={`badge badge--${court.isActive ? "success" : "neutral"}`}>
                  {court.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              
              <div className="resource-card__meta">
                <p className="muted">
                  {surfaceLabel(court.surface)} · Capacity {court.capacity}
                </p>
                <p className="resource-card__price">
                  {formatCurrency(court.hourlyRate)}<span className="unit">/hr</span>
                </p>
              </div>

              <div className="resource-card__actions">
                <Link href={`/courts/${court.id}`} className="button button--outline button--full">
                  View full details
                </Link>
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
