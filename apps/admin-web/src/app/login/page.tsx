import { loginAction } from "@/app/actions";

export default function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return <LoginScreen searchParams={searchParams} />;
}

async function LoginScreen({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="login-shell">
      <section className="panel login-panel">
        <p className="eyebrow">Aldawood Admin</p>
        <h1>Sign in to the operations desk</h1>
        <p className="muted">
          Use the seeded admin account and the configured admin password to access management
          screens.
        </p>
        <form action={loginAction} className="auth-form">
          <label className="agent-field">
            <span>Email</span>
            <input name="email" type="email" defaultValue="owner@aldawood.local" required />
          </label>
          <label className="agent-field">
            <span>Password</span>
            <input name="password" type="password" required />
          </label>
          {params.error ? (
            <p className="agent-error">The credentials were rejected by the backend.</p>
          ) : null}
          <button type="submit">Sign In</button>
        </form>
      </section>
    </div>
  );
}
