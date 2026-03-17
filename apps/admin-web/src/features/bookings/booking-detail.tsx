import Link from "next/link";
import {
  cancelBookingAction,
  confirmBookingAction,
  rescheduleBookingAction
} from "@/app/actions";
import { getBooking, getCourts } from "@/lib/api";
import {
  badgeTone,
  bookingStatusLabel,
  bookingTypeLabel,
  formatCurrency,
  formatDateTime
} from "@/lib/format";

export async function BookingDetail({ bookingId }: { bookingId: string }) {
  const [booking, courtsResponse] = await Promise.all([getBooking(bookingId), getCourts()]);

  if (!booking) {
    return (
      <section className="panel detail-panel">
        <p className="eyebrow">Booking</p>
        <h1>Booking not found</h1>
        <p className="muted">The backend did not return a record for this booking id.</p>
      </section>
    );
  }

  return (
    <div className="grid">
      <section className="panel section-intro">
        <p className="eyebrow">Booking Detail</p>
        <h1>{booking.customer?.name ?? booking.customer?.phone ?? "Customer booking"}</h1>
        <p className="muted">
          {bookingTypeLabel(booking.bookingType)} on {booking.court?.name ?? "Unknown court"}.
        </p>
        <div className="meta-row">
          <span className={`badge badge--${badgeTone(booking.status)}`}>
            {bookingStatusLabel(booking.status)}
          </span>
          <span>{formatDateTime(booking.startTime)}</span>
          <span>{booking.durationMins} mins</span>
        </div>
      </section>

      <section className="grid two">
        <article className="panel detail-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Reservation</p>
              <h2>Booking facts</h2>
            </div>
          </div>
          <dl className="detail-list">
            <div>
              <dt>Customer</dt>
              <dd>{booking.customer?.name ?? "Unnamed"}</dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>{booking.customer?.phone ?? "Unavailable"}</dd>
            </div>
            <div>
              <dt>Court</dt>
              <dd>{booking.court?.name ?? "Unavailable"}</dd>
            </div>
            <div>
              <dt>Window</dt>
              <dd>
                {formatDateTime(booking.startTime)} to {formatDateTime(booking.endTime)}
              </dd>
            </div>
            <div>
              <dt>Price</dt>
              <dd>{formatCurrency(booking.price)}</dd>
            </div>
            <div>
              <dt>Source</dt>
              <dd>{booking.source}</dd>
            </div>
          </dl>
        </article>

        <article className="panel detail-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Event Linkage</p>
              <h2>Package and follow-through</h2>
            </div>
          </div>
          {booking.eventExtras ? (
            <dl className="detail-list">
              <div>
                <dt>Package</dt>
                <dd>{booking.eventExtras.packageName ?? "Custom event"}</dd>
              </div>
              <div>
                <dt>Package price</dt>
                <dd>{formatCurrency(booking.eventExtras.packagePrice)}</dd>
              </div>
              <div>
                <dt>Event type</dt>
                <dd>{booking.eventExtras.eventType}</dd>
              </div>
              <div>
                <dt>Guest count</dt>
                <dd>{booking.eventExtras.guestCount ?? "Not supplied"}</dd>
              </div>
              <div>
                <dt>Special requests</dt>
                <dd>{booking.eventExtras.specialRequests ?? "None"}</dd>
              </div>
            </dl>
          ) : (
            <p className="muted">No event package is attached to this booking.</p>
          )}
          {booking.conversation ? (
            <Link href={`/conversations/${booking.conversation.id}`} className="text-link">
              Open linked conversation
            </Link>
          ) : null}
        </article>
      </section>

      <section className="grid two">
        <article className="panel detail-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Admin Action</p>
              <h2>Reschedule booking</h2>
            </div>
          </div>
          <form action={rescheduleBookingAction} className="management-form">
            <input type="hidden" name="bookingId" value={booking.id} />
            <label className="agent-field">
              <span>Start time</span>
              <input
                name="startTime"
                type="datetime-local"
                defaultValue={toDateTimeLocalValue(booking.startTime)}
                required
              />
            </label>
            <label className="agent-field">
              <span>Duration (mins)</span>
              <input
                name="durationMins"
                type="number"
                min={60}
                step={30}
                defaultValue={booking.durationMins}
                required
              />
            </label>
            <label className="agent-field">
              <span>Court</span>
              <select name="courtId" defaultValue={booking.courtId}>
                {courtsResponse.items.map((court) => (
                  <option key={court.id} value={court.id}>
                    {court.name} · {court.type}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit">Save reschedule</button>
          </form>
        </article>

        <article className="panel detail-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Status Control</p>
              <h2>Confirm or cancel</h2>
            </div>
          </div>
          {booking.status !== "confirmed" ? (
            <form action={confirmBookingAction} className="management-form">
              <input type="hidden" name="bookingId" value={booking.id} />
              <button type="submit">Confirm booking</button>
            </form>
          ) : (
            <p className="muted">This booking is already confirmed. You can still cancel it below.</p>
          )}
          <form action={cancelBookingAction} className="management-form">
            <input type="hidden" name="bookingId" value={booking.id} />
            <label className="agent-field">
              <span>Cancellation reason</span>
              <input
                name="reason"
                type="text"
                defaultValue={booking.cancelReason ?? "Cancelled by admin"}
              />
            </label>
            <button type="submit">Cancel booking</button>
          </form>
        </article>
      </section>
    </div>
  );
}

function toDateTimeLocalValue(value: string) {
  const date = new Date(value);
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return shifted.toISOString().slice(0, 16);
}
