import { getEventPackages } from "@/lib/api";
import { formatCurrency, packageTypeLabel } from "@/lib/format";

export async function PackagesOverview() {
  const response = await getEventPackages();

  return (
    <div className="grid">
      <section className="panel section-intro">
        <p className="eyebrow">Packages</p>
        <h1>Event package catalogue</h1>
        <p className="muted">
          What the agent can sell today, including guest ceilings, duration defaults, and included
          services.
        </p>
      </section>

      <section className="card-grid">
        {response.items.map((pkg) => (
          <article key={pkg.id} className="panel resource-card">
            <div className="resource-card__header">
              <div>
                <p className="eyebrow">{packageTypeLabel(pkg.type)}</p>
                <h2>{pkg.name}</h2>
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
          </article>
        ))}
      </section>
    </div>
  );
}
