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

      <section className="grid two">
        <article className="panel detail-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Availability</p>
              <h2>Create unavailability block</h2>
            </div>
          </div>
          <form action={createCourtBlockAction} className="management-form">
            <label className="agent-field">
              <span>Court</span>
              <select name="courtId" required>
                {response.items.map((court) => (
                  <option key={court.id} value={court.id}>
                    {court.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="agent-field">
              <span>Reason</span>
              <input name="reason" type="text" defaultValue="Maintenance block" required />
            </label>
            <label className="agent-field">
              <span>Start</span>
              <input name="startTime" type="datetime-local" required />
            </label>
            <label className="agent-field">
              <span>End</span>
              <input name="endTime" type="datetime-local" required />
            </label>
            <button type="submit">Add block</button>
          </form>
        </article>

        <article className="panel detail-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Pricing</p>
              <h2>Create pricing rule</h2>
            </div>
          </div>
          <form action={createPricingRuleAction} className="management-form">
            <label className="agent-field">
              <span>Court</span>
              <select name="courtId" required>
                {response.items.map((court) => (
                  <option key={court.id} value={court.id}>
                    {court.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="agent-field">
              <span>Rule name</span>
              <input name="name" type="text" defaultValue="Manual admin rule" required />
            </label>
            <div className="form-row">
              <label className="agent-field">
                <span>Start hour</span>
                <input name="startHour" type="number" min={0} max={23} defaultValue={18} required />
              </label>
              <label className="agent-field">
                <span>End hour</span>
                <input name="endHour" type="number" min={1} max={24} defaultValue={20} required />
              </label>
              <label className="agent-field">
                <span>Price</span>
                <input name="price" type="number" min={0} defaultValue={50} required />
              </label>
            </div>
            <div className="form-row">
              <label className="agent-field">
                <span>Priority</span>
                <input name="priority" type="number" min={1} defaultValue={100} required />
              </label>
              <label className="agent-field">
                <span>Day of week</span>
                <input name="dayOfWeek" type="number" min={0} max={6} defaultValue={5} />
              </label>
              <label className="checkbox-field">
                <input name="isPeak" type="checkbox" />
                <span>Peak rule</span>
              </label>
            </div>
            <button type="submit">Add pricing rule</button>
          </form>
        </article>
      </section>

      <section className="card-grid">
        {response.items.map((court) => (
          <article key={court.id} className="panel resource-card">
            <div className="resource-card__header">
              <div>
                <p className="eyebrow">{court.type}</p>
                <h2>{court.name}</h2>
              </div>
              <span className={`badge badge--${court.isActive ? "success" : "neutral"}`}>
                {court.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <p className="muted">
              {court.nameAr} · {surfaceLabel(court.surface)} · Capacity {court.capacity}
            </p>
            <div className="meta-row">
              <span>Base {formatCurrency(court.hourlyRate)}</span>
              <span>Peak {formatCurrency(court.peakRate)}</span>
            </div>

            <div className="resource-card__section">
              <strong>Pricing rules</strong>
              {court.pricingRules?.length ? (
                <ul className="resource-list">
                  {court.pricingRules.map((rule) => (
                    <li key={rule.id}>
                      <span>{rule.name}</span>
                      <span>
                        {rule.startHour}:00 to {rule.endHour}:00 · {formatCurrency(rule.price)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">No pricing rules attached.</p>
              )}
            </div>

            <div className="resource-card__section">
              <strong>Active blocks</strong>
              {court.blocks?.length ? (
                <ul className="resource-list">
                  {court.blocks.map((block) => (
                    <li key={block.id}>
                      <span>{block.reason}</span>
                      <span>{formatDateTime(block.startTime)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">No unavailability blocks recorded.</p>
              )}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
