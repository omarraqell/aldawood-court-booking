import Link from "next/link";
import { getCustomer } from "@/lib/api";

function segmentLabel(segment: string) {
  return segment.charAt(0).toUpperCase() + segment.slice(1);
}

function segmentBadge(segment: string) {
  switch (segment) {
    case "vip": return "success";
    case "regular": return "info";
    case "occasional": return "warning";
    default: return "neutral";
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric"
  });
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}

export async function CustomerDetailView({ id }: { id: string }) {
  const customer = await getCustomer(id);

  if (!customer) {
    return (
      <section className="panel detail-panel">
        <p className="eyebrow">Customer</p>
        <h1>Customer not found</h1>
        <p className="muted">The backend did not return a record for this customer id.</p>
      </section>
    );
  }

  return (
    <div className="grid">
      <section className="panel section-intro">
        <p className="eyebrow">Customer Detail</p>
        <h1>{customer.name ?? "Unknown"}</h1>
        <p className="muted">{customer.phone}</p>
        <div className="meta-row">
          <span className={`badge badge--${segmentBadge(customer.segment)}`}>
            {segmentLabel(customer.segment)}
          </span>
          <span>Language: {customer.preferredLang === "ar" ? "Arabic" : "English"}</span>
          <span>Joined: {formatDate(customer.firstContact)}</span>
        </div>
      </section>

      <section className="grid two">
        <article className="panel detail-panel">
          <p className="eyebrow">Contact Info</p>
          <dl className="detail-list">
            <div>
              <dt>Phone</dt>
              <dd>{customer.phone}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{customer.email ?? "Not provided"}</dd>
            </div>
            <div>
              <dt>Preferred Language</dt>
              <dd>{customer.preferredLang === "ar" ? "Arabic" : "English"}</dd>
            </div>
            <div>
              <dt>Last Contact</dt>
              <dd>{formatDate(customer.lastContact)}</dd>
            </div>
          </dl>
        </article>

        <article className="panel detail-panel">
          <p className="eyebrow">Stats</p>
          <dl className="detail-list">
            <div>
              <dt>Segment</dt>
              <dd>
                <span className={`badge badge--${segmentBadge(customer.segment)}`}>
                  {segmentLabel(customer.segment)}
                </span>
              </dd>
            </div>
            <div>
              <dt>Total Bookings</dt>
              <dd>{customer.totalBookings}</dd>
            </div>
            <div>
              <dt>Total Spent</dt>
              <dd>{Number(customer.totalSpent).toFixed(0)} JOD</dd>
            </div>
            <div>
              <dt>Notes</dt>
              <dd>{customer.notes ?? "None"}</dd>
            </div>
          </dl>
        </article>
      </section>

      {customer.bookings && customer.bookings.length > 0 && (
        <section className="panel">
          <p className="eyebrow">Recent Bookings</p>
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Court</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {customer.bookings.map((booking) => (
                <tr key={booking.id}>
                  <td>
                    <Link href={`/bookings/${booking.id}`} style={{ color: "var(--accent)", fontWeight: 600 }}>
                      {formatDateTime(booking.startTime)}
                    </Link>
                  </td>
                  <td>{booking.court?.name ?? "—"}</td>
                  <td>{booking.durationMins} mins</td>
                  <td>
                    <span className={`badge badge--${booking.status === "confirmed" ? "success" : booking.status === "cancelled" ? "danger" : "neutral"}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td>{Number(booking.price).toFixed(0)} JOD</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {customer.conversations && customer.conversations.length > 0 && (
        <section className="panel">
          <p className="eyebrow">Recent Conversations</p>
          <table className="table">
            <thead>
              <tr>
                <th>Started</th>
                <th>Channel</th>
                <th>Intent</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {customer.conversations.map((conv) => (
                <tr key={conv.id}>
                  <td>
                    <Link href={`/conversations/${conv.id}`} style={{ color: "var(--accent)", fontWeight: 600 }}>
                      {formatDateTime(conv.startedAt)}
                    </Link>
                  </td>
                  <td>{conv.channel}</td>
                  <td>{conv.intent ?? "—"}</td>
                  <td>
                    <span className={`badge badge--${conv.status === "completed" ? "success" : conv.status === "active" ? "info" : "neutral"}`}>
                      {conv.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
