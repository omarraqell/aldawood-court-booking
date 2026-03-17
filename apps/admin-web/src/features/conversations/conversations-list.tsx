import Link from "next/link";
import { getConversations } from "@/lib/api";
import {
  badgeTone,
  channelLabel,
  conversationStatusLabel,
  formatDateTime,
  intentLabel
} from "@/lib/format";

export async function ConversationsList() {
  const response = await getConversations();
  const conversations = response.items;
  const waitingCount = conversations.filter((item) =>
    ["active", "waiting_customer", "waiting_system"].includes(item.status)
  ).length;

  return (
    <div className="grid">
      <section className="panel section-intro">
        <p className="eyebrow">Conversations</p>
        <h1>Agent activity inbox</h1>
        <p className="muted">
          Review the live queue, inspect summaries, and open the full transcript behind each
          customer interaction.
        </p>
        <div className="meta-row">
          <span>{conversations.length} total</span>
          <span>{waitingCount} waiting</span>
        </div>
      </section>

      <section className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Contact</th>
              <th>Intent</th>
              <th>Channel</th>
              <th>Status</th>
              <th>Latest</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {conversations.map((conversation) => (
              <tr key={conversation.id}>
                <td>
                  <div className="table-primary">
                    <strong>
                      {conversation.customer?.name ??
                        conversation.customer?.phone ??
                        "Anonymous contact"}
                    </strong>
                    <span>{conversation.customer?.phone ?? "No phone on file"}</span>
                  </div>
                </td>
                <td>{intentLabel(conversation.intent)}</td>
                <td>{channelLabel(conversation.channel)}</td>
                <td>
                  <span className={`badge badge--${badgeTone(conversation.status)}`}>
                    {conversationStatusLabel(conversation.status)}
                  </span>
                </td>
                <td>{formatDateTime(conversation.lastMessageAt ?? conversation.startedAt)}</td>
                <td>
                  <Link href={`/conversations/${conversation.id}`} className="text-link">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {conversations.length === 0 ? <p className="muted">No conversations recorded yet.</p> : null}
      </section>
    </div>
  );
}
