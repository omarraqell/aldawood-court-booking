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
      <div className="login-visual">
        <div className="visual-graphic">
          <div className="court-lines" />
          <div className="court-grid" />
          <div className="glass-overlay" />
        </div>
        <div className="visual-content">
          <p className="eyebrow fade-in-up" style={{ animationDelay: "200ms" }}>Nice to see you again</p>
          <h1 className="display-title fade-in-up" style={{ animationDelay: "400ms" }}>WELCOME BACK</h1>
          <div className="accent-bar fade-in-up" style={{ animationDelay: "600ms" }} />
          <p className="muted fade-in-up" style={{ animationDelay: "800ms" }}>
            The aldawood backend operations console. 
            Manage courts, bookings and pricing in one place.
          </p>
        </div>
      </div>

      <div className="login-content">
        <section className="login-panel">
          <div className="login-header">
            <p className="eyebrow fade-in-up" style={{ animationDelay: "100ms" }}>Aldawood Admin</p>
            <h1 className="fade-in-up" style={{ animationDelay: "200ms" }}>Login Account</h1>
            <p className="muted fade-in-up" style={{ animationDelay: "300ms" }}>
              Enter your administrative credentials to access the desk.
            </p>
          </div>
          <form action={loginAction} className="auth-form fade-in-up" style={{ animationDelay: "400ms" }}>
            <label className="agent-field">
              <span>Email Address</span>
              <input name="email" type="email" defaultValue="owner@aldawood.local" placeholder="email@example.com" required />
            </label>
            <label className="agent-field">
              <span>Secret Password</span>
              <input name="password" type="password" placeholder="••••••••" required />
            </label>
            {params.error ? (
              <p className="agent-error">The credentials were rejected by the backend.</p>
            ) : null}
            <button type="submit" className="login-btn">
              <span>Sign In</span>
              <div className="hover-glow"></div>
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
