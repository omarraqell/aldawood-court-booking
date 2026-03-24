import Link from "next/link";
import { getCustomers } from "@/lib/api";

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

export async function CustomersOverview() {
  const response = await getCustomers();

  return (
    <div className="grid">
      <section className="panel section-intro">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Customers</p>
            <h1>Customer directory</h1>
            <p className="muted">
              All customers who have interacted with the booking system.
            </p>
          </div>
        </div>
      </section>

      <section className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Segment</th>
              <th>Bookings</th>
              <th>Total Spent</th>
              <th>Last Contact</th>
            </tr>
          </thead>
          <tbody>
            {response.items.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "var(--sp-6)" }}>
                  <p className="muted">No customers yet.</p>
                </td>
              </tr>
            )}
            {response.items.map((customer) => (
              <tr key={customer.id}>
                <td>
                  <Link href={`/customers/${customer.id}`} style={{ color: "var(--accent)", fontWeight: 600 }}>
                    {customer.name ?? "Unknown"}
                  </Link>
                </td>
                <td>{customer.phone}</td>
                <td>{customer.email ?? "—"}</td>
                <td>
                  <span className={`badge badge--${segmentBadge(customer.segment)}`}>
                    {segmentLabel(customer.segment)}
                  </span>
                </td>
                <td>{customer.totalBookings}</td>
                <td>{Number(customer.totalSpent).toFixed(0)} JOD</td>
                <td>{new Date(customer.lastContact).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
