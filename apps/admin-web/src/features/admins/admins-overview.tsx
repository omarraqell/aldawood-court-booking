import { getAdmins } from "@/lib/api";

export async function AdminsOverview() {
  const response = await getAdmins();

  return (
    <div className="grid">
      <section className="panel section-intro">
        <p className="eyebrow">Admins</p>
        <h1>Operator roster</h1>
        <p className="muted">Current back-office users available to manage bookings and settings.</p>
      </section>

      <section className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {response.items.map((admin) => (
              <tr key={admin.id}>
                <td>{admin.name}</td>
                <td>{admin.email}</td>
                <td>{admin.role}</td>
                <td>{admin.isActive ? "Active" : "Inactive"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
