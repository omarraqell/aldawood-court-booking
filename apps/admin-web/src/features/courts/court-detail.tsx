import Link from "next/link";
import { getCourt, getBookings } from "@/lib/api";
import { createCourtBlockAction, createPricingRuleAction } from "@/app/actions";
import {
  badgeTone,
  bookingStatusLabel,
  formatCurrency,
  formatDateTime,
  formatDate,
  formatTime,
  surfaceLabel,
  bookingTypeLabel
} from "@/lib/format";

export async function CourtDetail({ courtId }: { courtId: string }) {
  const [court, bookingsResponse] = await Promise.all([
    getCourt(courtId),
    getBookings()
  ]);

  if (!court) {
    return (
      <div className="grid">
        <section className="panel section-intro">
          <p className="eyebrow">Court Not Found</p>
          <h1>This court does not exist</h1>
          <p className="muted">
            The court you are looking for could not be loaded from the backend.
          </p>
          <Link href="/courts" className="hero-link hero-link--primary" style={{ width: "fit-content" }}>
            Back to courts
          </Link>
        </section>
      </div>
    );
  }

  const courtBookings = bookingsResponse.items.filter(
    (b) => b.courtId === court.id
  );
  const now = Date.now();
  const upcomingBookings = courtBookings
    .filter((b) => b.status === "confirmed" && new Date(b.startTime).getTime() >= now)
    .slice(0, 5);
  const recentBookings = courtBookings
    .filter((b) => new Date(b.startTime).getTime() < now)
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .slice(0, 5);
  const totalRevenue = courtBookings.reduce(
    (sum, b) => sum + Number(b.price || 0),
    0
  );
  const confirmedCount = courtBookings.filter((b) => b.status === "confirmed").length;
  const cancelledCount = courtBookings.filter((b) => b.status === "cancelled").length;

  return (
    <div className="grid">
      {/* Hero */}
      <section className="hero panel">
        <div className="hero__content">
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <Link href="/courts" className="text-link" style={{ fontSize: "var(--text-sm)" }}>
              ← Courts
            </Link>
          </div>
          <p className="eyebrow">{court.type} · {surfaceLabel(court.surface)}</p>
          <h1>{court.name}</h1>
          <p className="muted hero__copy">
            {court.nameAr} · Capacity {court.capacity} players
            {court.mapsLink ? " · " : ""}
            {court.mapsLink && (
              <a href={court.mapsLink} target="_blank" rel="noreferrer" className="text-link">
                View on map
              </a>
            )}
          </p>
          <div className="hero__actions">
            <Link href="/courts" className="hero-link">
              All courts
            </Link>
          </div>
        </div>
        <div className="hero__meta">
          <div>
            <span className="eyebrow">Status</span>
            <strong>
              <span className={`badge badge--${court.isActive ? "success" : "danger"}`}>
                {court.isActive ? "Active" : "Inactive"}
              </span>
            </strong>
          </div>
          <div>
            <span className="eyebrow">Base Rate</span>
            <strong>{formatCurrency(court.hourlyRate)}</strong>
          </div>
          <div>
            <span className="eyebrow">Peak Rate</span>
            <strong>{formatCurrency(court.peakRate)}</strong>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="stats-grid">
        <article className="panel stat-card">
          <span className="eyebrow">Total Bookings</span>
          <strong>{courtBookings.length}</strong>
          <span className="muted">All-time reservations on this court.</span>
        </article>
        <article className="panel stat-card">
          <span className="eyebrow">Confirmed</span>
          <strong>{confirmedCount}</strong>
          <span className="muted">Active or completed sessions.</span>
        </article>
        <article className="panel stat-card">
          <span className="eyebrow">Cancelled</span>
          <strong>{cancelledCount}</strong>
          <span className="muted">Sessions that were cancelled.</span>
        </article>
        <article className="panel stat-card">
          <span className="eyebrow">Revenue</span>
          <strong>{formatCurrency(totalRevenue)}</strong>
          <span className="muted">Total income from this court.</span>
        </article>
      </section>

      {/* Management Forms */}
      <section className="grid two">
        <article className="panel detail-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Availability</p>
              <h2>Create unavailability block</h2>
            </div>
          </div>
          <form action={createCourtBlockAction} className="management-form">
            <input type="hidden" name="courtId" value={court.id} />
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
            <input type="hidden" name="courtId" value={court.id} />
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

      {/* Court Info + Pricing Rules */}
      <section className="grid two">
        <article className="panel resource-card">
          <div className="resource-card__header">
            <div>
              <p className="eyebrow">Court Info</p>
              <h2>Specifications</h2>
            </div>
          </div>
          <div className="detail-list">
            <div>
              <dt>Name (Arabic)</dt>
              <dd>{court.nameAr}</dd>
            </div>
            <div>
              <dt>Type</dt>
              <dd>{court.type}</dd>
            </div>
            <div>
              <dt>Surface</dt>
              <dd>{surfaceLabel(court.surface)}</dd>
            </div>
            <div>
              <dt>Capacity</dt>
              <dd>{court.capacity} players</dd>
            </div>
            <div>
              <dt>Base Hourly Rate</dt>
              <dd>{formatCurrency(court.hourlyRate)}</dd>
            </div>
            <div>
              <dt>Peak Hourly Rate</dt>
              <dd>{formatCurrency(court.peakRate)}</dd>
            </div>
          </div>
        </article>

        <article className="panel resource-card">
          <div className="resource-card__header">
            <div>
              <p className="eyebrow">Pricing</p>
              <h2>Pricing Rules</h2>
            </div>
            <span className="badge badge--accent">{court.pricingRules?.length ?? 0} rules</span>
          </div>
          {court.pricingRules?.length ? (
            <ul className="resource-list">
              {court.pricingRules.map((rule) => (
                <li key={rule.id}>
                  <span>{rule.name}</span>
                  <span>
                    {rule.startHour}:00 – {rule.endHour}:00 · {formatCurrency(rule.price)}
                    {rule.isPeak ? " · Peak" : ""}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">No pricing rules configured for this court.</p>
          )}
        </article>
      </section>

      {/* Blocks */}
      <section className="panel resource-card">
        <div className="resource-card__header">
          <div>
            <p className="eyebrow">Availability</p>
            <h2>Unavailability Blocks</h2>
          </div>
          <span className="badge badge--neutral">{court.blocks?.length ?? 0} blocks</span>
        </div>
        {court.blocks?.length ? (
          <ul className="resource-list">
            {court.blocks.map((block) => (
              <li key={block.id}>
                <span>{block.reason}</span>
                <span>{formatDateTime(block.startTime)} – {formatDateTime(block.endTime)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">No unavailability blocks recorded. This court is fully available.</p>
        )}
      </section>

      {/* Upcoming Bookings */}
      <section className="grid two">
        <article className="panel detail-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Schedule</p>
              <h2>Upcoming bookings</h2>
            </div>
            <Link href="/bookings" className="text-link">
              All bookings
            </Link>
          </div>
          <div className="stack-list">
            {upcomingBookings.length === 0 ? (
              <p className="muted">No upcoming confirmed bookings for this court.</p>
            ) : (
              upcomingBookings.map((booking) => (
                <Link key={booking.id} href={`/bookings/${booking.id}`} className="stack-card">
                  <div className="stack-card__header">
                    <strong>{booking.customer?.name ?? booking.customer?.phone ?? "Walk-in"}</strong>
                    <span className={`badge badge--${badgeTone(booking.status)}`}>
                      {bookingStatusLabel(booking.status)}
                    </span>
                  </div>
                  <p className="muted">
                    {formatDate(booking.startTime)} · {formatTime(booking.startTime)} – {formatTime(booking.endTime)}
                  </p>
                  <div className="meta-row">
                    <span>{bookingTypeLabel(booking.bookingType)}</span>
                    <span>{formatCurrency(booking.price)}</span>
                    <span>{booking.durationMins} mins</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </article>

        <article className="panel detail-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">History</p>
              <h2>Recent bookings</h2>
            </div>
          </div>
          <div className="stack-list">
            {recentBookings.length === 0 ? (
              <p className="muted">No past bookings found for this court yet.</p>
            ) : (
              recentBookings.map((booking) => (
                <Link key={booking.id} href={`/bookings/${booking.id}`} className="stack-card">
                  <div className="stack-card__header">
                    <strong>{booking.customer?.name ?? booking.customer?.phone ?? "Walk-in"}</strong>
                    <span className={`badge badge--${badgeTone(booking.status)}`}>
                      {bookingStatusLabel(booking.status)}
                    </span>
                  </div>
                  <p className="muted">
                    {formatDate(booking.startTime)} · {formatTime(booking.startTime)} – {formatTime(booking.endTime)}
                  </p>
                  <div className="meta-row">
                    <span>{bookingTypeLabel(booking.bookingType)}</span>
                    <span>{formatCurrency(booking.price)}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
