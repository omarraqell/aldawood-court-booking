import Link from "next/link";
import { getBookings, getConversations, getCourts, getEventPackages, getPolicies } from "@/lib/api";
import {
  badgeTone,
  bookingStatusLabel,
  bookingTypeLabel,
  formatCurrency,
  formatDateTime
} from "@/lib/format";

export async function DashboardOverview() {
  const [bookingsResponse, conversationsResponse, courtsResponse, packagesResponse, policy] =
    await Promise.all([
      getBookings(),
      getConversations(),
      getCourts(),
      getEventPackages(),
      getPolicies()
    ]);

  const bookings = bookingsResponse.items;
  const conversations = conversationsResponse.items;
  const courts = courtsResponse.items;
  const packages = packagesResponse.items;

  const now = Date.now();
  const confirmedUpcoming = bookings.filter(
    (booking) => booking.status === "confirmed" && new Date(booking.startTime).getTime() >= now
  );
  const packageBookings = bookings.filter((booking) => booking.eventExtras?.packageName);
  const waitingConversations = conversations.filter((conversation) =>
    ["active", "waiting_customer", "waiting_system"].includes(conversation.status)
  );
  const cancelledBookings = bookings.filter((booking) => booking.status === "cancelled");
  const activeCourts = courts.filter((court) => court.isActive);
  const nextThreeBookings = confirmedUpcoming.slice(0, 3);
  const latestConversations = conversations.slice(0, 4);
  const highlightedPackages = packages.slice(0, 2);

  return (
    <div className="grid">
      <section className="hero panel">
        <div className="hero__content">
          <p className="eyebrow">Live Control Surface</p>
          <h1>Run the venue from one focused operations shell</h1>
          <p className="muted hero__copy">
            Watch queue pressure, upcoming sessions, court readiness, and package demand without
            leaving the desk. The dashboard is driven by the real backend and designed for fast
            operator scanning.
          </p>
          <div className="hero__actions">
            <Link href="/bookings" className="hero-link hero-link--primary">
              Review live bookings
            </Link>
            <Link href="/agent-test-console" className="hero-link">
              Open agent lab
            </Link>
          </div>
        </div>
        <div className="hero__meta">
          <div>
            <span className="eyebrow">Timezone</span>
            <strong>{policy?.timezone ?? "Not configured"}</strong>
          </div>
          <div>
            <span className="eyebrow">Operating Window</span>
            <strong>
              {policy ? `${policy.openingTime} to ${policy.closingTime}` : "Not configured"}
            </strong>
          </div>
          <div>
            <span className="eyebrow">Attention Needed</span>
            <strong>{waitingConversations.length + cancelledBookings.length}</strong>
          </div>
        </div>
      </section>

      <section className="stats-grid">
        <article className="panel stat-card">
          <span className="eyebrow">Bookings</span>
          <strong>{bookingsResponse.pagination.total}</strong>
          <span className="muted">Total reservations currently in the system.</span>
        </article>
        <article className="panel stat-card">
          <span className="eyebrow">Upcoming Confirmed</span>
          <strong>{confirmedUpcoming.length}</strong>
          <span className="muted">Future sessions still active for operations.</span>
        </article>
        <article className="panel stat-card">
          <span className="eyebrow">Packages</span>
          <strong>{packageBookings.length}</strong>
          <span className="muted">Event bookings carrying package metadata.</span>
        </article>
        <article className="panel stat-card">
          <span className="eyebrow">Agent Queue</span>
          <strong>{waitingConversations.length}</strong>
          <span className="muted">Conversations still active or waiting on a reply.</span>
        </article>
        <article className="panel stat-card">
          <span className="eyebrow">Active Courts</span>
          <strong>{activeCourts.length}</strong>
          <span className="muted">Live booking resources currently enabled.</span>
        </article>
        <article className="panel stat-card">
          <span className="eyebrow">Packages Live</span>
          <strong>{packages.length}</strong>
          <span className="muted">Event offers visible to the agent and operations team.</span>
        </article>
      </section>

      <section className="grid three">
        <article className="panel spotlight-card">
          <p className="eyebrow">Pressure Point</p>
          <h2>{waitingConversations.length > 0 ? "Agent follow-up queue is active" : "Agent queue is clear"}</h2>
          <p className="muted">
            {waitingConversations.length > 0
              ? `${waitingConversations.length} conversations are still waiting on customers or backend responses.`
              : "No waiting conversations are currently blocking the booking flow."}
          </p>
          <Link href="/conversations" className="text-link">
            Inspect queue
          </Link>
        </article>

        <article className="panel spotlight-card">
          <p className="eyebrow">Package Pulse</p>
          <h2>{packageBookings.length} event bookings on the books</h2>
          <div className="stack-list">
            {highlightedPackages.map((pkg) => (
              <div key={pkg.id} className="stack-card stack-card--compact">
                <strong>{pkg.name}</strong>
                <span className="muted">
                  {formatCurrency(pkg.basePrice)} · {pkg.durationMins} mins
                </span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel spotlight-card">
          <p className="eyebrow">Quick Actions</p>
          <div className="quick-links">
            <Link href="/courts" className="stack-card stack-card--compact">
              <strong>Block a court</strong>
              <span className="muted">Pause inventory for maintenance or private use.</span>
            </Link>
            <Link href="/policies" className="stack-card stack-card--compact">
              <strong>Update booking policy</strong>
              <span className="muted">Adjust lead time, hours, or cancellation windows.</span>
            </Link>
          </div>
        </article>
      </section>

      <section className="grid two">
        <article className="panel detail-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Next Up</p>
              <h2>Upcoming bookings</h2>
            </div>
            <Link href="/bookings" className="text-link">
              Open bookings
            </Link>
          </div>
          <div className="stack-list">
            {nextThreeBookings.length === 0 ? (
              <p className="muted">No upcoming confirmed bookings yet.</p>
            ) : (
              nextThreeBookings.map((booking) => (
                <Link key={booking.id} href={`/bookings/${booking.id}`} className="stack-card">
                  <div className="stack-card__header">
                    <strong>{booking.customer?.name ?? booking.customer?.phone ?? "Walk-in"}</strong>
                    <span className={`badge badge--${badgeTone(booking.status)}`}>
                      {bookingStatusLabel(booking.status)}
                    </span>
                  </div>
                  <p className="muted">
                    {booking.court?.name ?? "Court unavailable"} · {formatDateTime(booking.startTime)}
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
              <p className="eyebrow">Conversation Feed</p>
              <h2>Recent agent traffic</h2>
            </div>
            <Link href="/conversations" className="text-link">
              Review inbox
            </Link>
          </div>
          <div className="stack-list">
            {latestConversations.length === 0 ? (
              <p className="muted">No conversation traffic recorded yet.</p>
            ) : (
              latestConversations.map((conversation) => (
                <Link
                  key={conversation.id}
                  href={`/conversations/${conversation.id}`}
                  className="stack-card"
                >
                  <div className="stack-card__header">
                    <strong>
                      {conversation.customer?.name ??
                        conversation.customer?.phone ??
                        "Anonymous contact"}
                    </strong>
                    <span className={`badge badge--${badgeTone(conversation.status)}`}>
                      {conversation.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="muted line-clamp-2">
                    {conversation.summary ?? "Conversation started without a generated summary yet."}
                  </p>
                  <div className="meta-row">
                    <span>{conversation.intent ?? "unknown intent"}</span>
                    <span>{formatDateTime(conversation.lastMessageAt ?? conversation.startedAt)}</span>
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
