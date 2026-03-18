import { updatePolicyAction } from "@/app/actions";
import { getPolicies } from "@/lib/api";

export async function PoliciesPanel() {
  const policy = await getPolicies();

  if (!policy) {
    return (
      <section className="panel section-intro">
        <p className="eyebrow">Policies</p>
        <h1>Booking policies unavailable</h1>
        <p className="muted">The backend did not return the current venue policy.</p>
      </section>
    );
  }

  return (
    <div className="grid">
      <section className="panel section-intro">
        <p className="eyebrow">Policies</p>
        <h1>Venue operating rules</h1>
        <p className="muted">
          The same settings the backend and agent use for lead time, duration limits, and operating
          hours.
        </p>
      </section>

      <section className="grid two">
        <article className="panel detail-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Window</p>
              <h2>Operating hours and slot cadence</h2>
            </div>
          </div>
          <dl className="detail-list">
            <div>
              <dt>Timezone</dt>
              <dd>{policy.timezone}</dd>
            </div>
            <div>
              <dt>Opening</dt>
              <dd>{policy.openingTime}</dd>
            </div>
            <div>
              <dt>Closing</dt>
              <dd>{policy.closingTime}</dd>
            </div>
            <div>
              <dt>Slot interval</dt>
              <dd>{policy.slotIntervalMins} mins</dd>
            </div>
          </dl>
        </article>

        <article className="panel detail-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Controls</p>
              <h2>Lead time and change windows</h2>
            </div>
          </div>
          <dl className="detail-list">
            <div>
              <dt>Minimum duration</dt>
              <dd>{policy.minBookingDurationMins} mins</dd>
            </div>
            <div>
              <dt>Maximum duration</dt>
              <dd>{policy.maxBookingDurationMins} mins</dd>
            </div>
            <div>
              <dt>Lead time</dt>
              <dd>{policy.minLeadTimeMins} mins</dd>
            </div>
            <div>
              <dt>Cancellation cutoff</dt>
              <dd>{policy.cancellationCutoffMins} mins</dd>
            </div>
            <div>
              <dt>Modification cutoff</dt>
              <dd>{policy.modificationCutoffMins} mins</dd>
            </div>
          </dl>
        </article>
      </section>

      <section className="panel detail-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Edit</p>
            <h2>Update live policy</h2>
          </div>
        </div>
        <form action={updatePolicyAction} className="management-form">
          <div className="form-row">
            <label className="agent-field">
              <span>Timezone</span>
              <input name="timezone" type="text" defaultValue={policy.timezone} required />
            </label>
            <label className="agent-field">
              <span>Slot interval</span>
              <input
                name="slotIntervalMins"
                type="number"
                min={30}
                step={30}
                defaultValue={policy.slotIntervalMins}
                required
              />
            </label>
            <label className="agent-field">
              <span>Lead time</span>
              <input
                name="minLeadTimeMins"
                type="number"
                min={0}
                step={30}
                defaultValue={policy.minLeadTimeMins}
                required
              />
            </label>
          </div>
          <div className="form-row">
            <label className="agent-field">
              <span>Opening</span>
              <input name="openingTime" type="time" defaultValue={policy.openingTime} required />
            </label>
            <label className="agent-field">
              <span>Closing</span>
              <input name="closingTime" type="time" defaultValue={policy.closingTime} required />
            </label>
            <label className="agent-field">
              <span>Min duration</span>
              <input
                name="minBookingDurationMins"
                type="number"
                min={30}
                step={30}
                defaultValue={policy.minBookingDurationMins}
                required
              />
            </label>
            <label className="agent-field">
              <span>Max duration</span>
              <input
                name="maxBookingDurationMins"
                type="number"
                min={60}
                step={30}
                defaultValue={policy.maxBookingDurationMins}
                required
              />
            </label>
          </div>
          <div className="form-row">
            <label className="agent-field">
              <span>Cancellation cutoff</span>
              <input
                name="cancellationCutoffMins"
                type="number"
                min={0}
                step={30}
                defaultValue={policy.cancellationCutoffMins}
                required
              />
            </label>
            <label className="agent-field">
              <span>Modification cutoff</span>
              <input
                name="modificationCutoffMins"
                type="number"
                min={0}
                step={30}
                defaultValue={policy.modificationCutoffMins}
                required
              />
            </label>
          </div>
          <button type="submit">Save policy</button>
        </form>
      </section>
    </div>
  );
}
