import { getAuditLogs } from "@/lib/api";
import { formatDateTime } from "@/lib/format";

export async function AuditLogList() {
  const response = await getAuditLogs();

  return (
    <div className="grid">
      <section className="panel section-intro">
        <p className="eyebrow">Audit</p>
        <h1>Recent system changes</h1>
        <p className="muted">
          Backend mutation trace for booking, pricing, policy, and availability changes.
        </p>
      </section>

      <section className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>When</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Actor</th>
            </tr>
          </thead>
          <tbody>
            {response.items.map((item) => (
              <tr key={item.id}>
                <td>{formatDateTime(item.createdAt)}</td>
                <td>{item.action}</td>
                <td>
                  {item.entityType} · {item.entityId}
                </td>
                <td>
                  {item.actorType}
                  {item.actorId ? ` · ${item.actorId}` : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
