import { getAdmins } from "@/lib/api";
import { AdminsActions } from "./admins-actions";

export async function AdminsOverview() {
  const response = await getAdmins();

  return (
    <div className="grid">
      <section className="panel section-intro">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Admins</p>
            <h1>Operator roster</h1>
            <p className="muted">
              Current back-office users available to manage bookings and settings.
            </p>
          </div>
        </div>
      </section>

      <AdminsActions admins={response.items} />
    </div>
  );
}
