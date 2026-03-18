import Link from "next/link";
import { getBookings } from "@/lib/api";
import {
  badgeTone,
  bookingStatusLabel,
  bookingTypeLabel,
  formatCurrency,
  formatDateTime
} from "@/lib/format";

export async function BookingsTable() {
  const response = await getBookings();
  const bookings = response.items;
  const confirmedCount = bookings.filter((booking) => booking.status === "confirmed").length;
  const cancelledCount = bookings.filter((booking) => booking.status === "cancelled").length;
  const packageCount = bookings.filter((booking) => booking.eventExtras?.packageName).length;

  return (
    <div className="grid">
      <section className="panel section-intro">
        <p className="eyebrow">Bookings</p>
        <h1>Reservation ledger</h1>
        <p className="muted">
          Every confirmed, cancelled, completed, and event-linked booking coming from the real
          system of record.
        </p>
        <div className="meta-row">
          <span>{response.pagination.total} total</span>
          <span>{confirmedCount} confirmed</span>
          <span>{cancelledCount} cancelled</span>
          <span>{packageCount} package bookings</span>
        </div>
      </section>

      <section className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Booking</th>
              <th>Court</th>
              <th>Start</th>
              <th>Status</th>
              <th>Revenue</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id}>
                <td>
                  <div className="table-primary">
                    <strong>{booking.customer?.name ?? "Unnamed customer"}</strong>
                    <span>{booking.customer?.phone ?? "No phone"}</span>
                  </div>
                </td>
                <td>
                  <div className="table-primary">
                    <span>{bookingTypeLabel(booking.bookingType)}</span>
                    <span>{booking.eventExtras?.packageName ?? booking.source}</span>
                  </div>
                </td>
                <td>
                  <div className="table-primary">
                    <strong>{booking.court?.name ?? "Missing court"}</strong>
                    <span>{booking.court?.type ?? "Unknown type"}</span>
                  </div>
                </td>
                <td>{formatDateTime(booking.startTime)}</td>
                <td>
                  <span className={`badge badge--${badgeTone(booking.status)}`}>
                    {bookingStatusLabel(booking.status)}
                  </span>
                </td>
                <td>{formatCurrency(booking.price)}</td>
                <td>
                  <Link href={`/bookings/${booking.id}`} className="text-link">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {bookings.length === 0 ? <p className="muted">No bookings found yet.</p> : null}
      </section>
    </div>
  );
}
