import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import { logoutAction } from "@/app/actions";
import { ShellNav } from "@/components/shell-nav";
import { getAdminSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Aldawood Admin",
  description: "Admin platform and internal AI agent console"
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const session = await getAdminSession();

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <div className="app-shell">
          {session ? (
            <aside className="shell-aside">
              <div className="shell-brand panel">
                <p className="eyebrow">Aldawood Courts</p>
                <h1>Operations Desk</h1>
                <p className="muted">
                  Live booking control, agent visibility, pricing rules, and venue operations.
                </p>
              </div>
              <ShellNav />
            </aside>
          ) : null}
          <div className="shell-content">
            <main id="main-content">
              {session ? (
                <header className="shell-header panel">
                  <div>
                    <p className="eyebrow">Signed in</p>
                    <strong>{session.admin.name}</strong>
                    <p className="muted">
                      {session.admin.email} · {session.admin.role}
                    </p>
                  </div>
                  <div className="shell-header__actions">
                    <span className="shell-status-pill">Live operations mode</span>
                    <form action={logoutAction}>
                      <button type="submit" className="agent-secondary-button">
                        Sign out
                      </button>
                    </form>
                  </div>
                </header>
              ) : null}
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
