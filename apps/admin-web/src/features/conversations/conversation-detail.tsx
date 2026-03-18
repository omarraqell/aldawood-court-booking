import Link from "next/link";
import { getConversation } from "@/lib/api";
import {
  badgeTone,
  channelLabel,
  conversationStatusLabel,
  formatCurrency,
  formatDateTime,
  intentLabel
} from "@/lib/format";

export async function ConversationDetail({ conversationId }: { conversationId: string }) {
  const conversation = await getConversation(conversationId);

  if (!conversation) {
    return (
      <section className="panel detail-panel">
        <p className="eyebrow">Conversation</p>
        <h1>Conversation not found</h1>
        <p className="muted">The backend did not return a record for this conversation id.</p>
      </section>
    );
  }

  return (
    <div className="grid">
      <section className="panel section-intro">
        <p className="eyebrow">Conversation Detail</p>
        <h1>{conversation.customer?.phone ?? "Anonymous thread"}</h1>
        <p className="muted">{conversation.summary ?? "No summary has been written yet."}</p>
        <div className="meta-row">
          <span>{intentLabel(conversation.intent)}</span>
          <span>{channelLabel(conversation.channel)}</span>
          <span className={`badge badge--${badgeTone(conversation.status)}`}>
            {conversationStatusLabel(conversation.status)}
          </span>
        </div>
      </section>

      <section className="grid two">
        <article className="panel detail-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Customer</p>
              <h2>Contact and booking context</h2>
            </div>
          </div>
          <dl className="detail-list">
            <div>
              <dt>Customer</dt>
              <dd>{conversation.customer?.name ?? "Unnamed"}</dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>{conversation.customer?.phone ?? "Unavailable"}</dd>
            </div>
            <div>
              <dt>Started</dt>
              <dd>{formatDateTime(conversation.startedAt)}</dd>
            </div>
            <div>
              <dt>Last activity</dt>
              <dd>{formatDateTime(conversation.lastMessageAt ?? conversation.startedAt)}</dd>
            </div>
          </dl>

          {conversation.booking?.length ? (
            <div className="inline-list">
              {conversation.booking.map((booking) => (
                <Link key={booking.id} href={`/bookings/${booking.id}`} className="stack-card stack-card--compact">
                  <strong>{booking.court?.name ?? "Court unavailable"}</strong>
                  <span>{formatDateTime(booking.startTime)}</span>
                  <span>{formatCurrency(booking.price)}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="muted">No booking has been linked to this thread yet.</p>
          )}
        </article>

        <article className="panel detail-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Transcript</p>
              <h2>Message trail</h2>
            </div>
          </div>
          <div className="message-log">
            {conversation.messages?.length ? (
              conversation.messages.map((message) => (
                <div key={message.id} className={`message-log__item ${message.role}`}>
                  <div className="message-log__meta">
                    <strong>{message.role}</strong>
                    <span>{formatDateTime(message.createdAt)}</span>
                  </div>
                  <p>{message.content}</p>
                </div>
              ))
            ) : (
              <p className="muted">No persisted messages for this conversation yet.</p>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
