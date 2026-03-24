import { getEventPackages } from "@/lib/api";
import { formatCurrency, packageTypeLabel } from "@/lib/format";
import { PackagesActions } from "./packages-actions";

export async function PackagesOverview() {
  const response = await getEventPackages();

  return (
    <div className="grid">
      <section className="panel section-intro">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Packages</p>
            <h1>Event package catalogue</h1>
            <p className="muted">
              What the agent can sell today, including guest ceilings, duration defaults, and included
              services.
            </p>
          </div>
        </div>
      </section>

      <PackagesActions packages={response.items} />
    </div>
  );
}
