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
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body suppressHydrationWarning>
        {session ? (
          <div className="app-shell">
            <aside className="shell-aside">
              <div className="sidebar-logo" style={{ background: 'var(--accent)', color: 'black' }}>A</div>
              <ShellNav />
              <div style={{ marginTop: 'auto' }}>
              </div>
            </aside>
            <div className="shell-content">
              <header className="shell-header">
                <div className="header-right">
                  <div className="profile-trigger">
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{session.admin.name}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>@{session.admin.role}</div>
                    </div>
            <div className="profile-avatar" style={{ display: 'flex', alignItems: 'center', justifySelf: 'center', background: 'var(--surface-raised)', fontSize: '10px', border: '1px solid var(--accent)' }}>
              <img src={`https://ui-avatars.com/api/?name=${session.admin.name}&background=00ab96&color=fff`} className="profile-avatar" alt="" />
            </div>
                  </div>
                  <form action={logoutAction}>
                    <button type="submit" className="nav-pill" style={{ border: 'none', cursor: 'pointer', background: 'none' }}>
                      Sign out
                    </button>
                  </form>
                </div>
              </header>
              <main id="main-content">
                {children}
              </main>
            </div>
          </div>
        ) : (
          <main id="main-content">
            {children}
          </main>
        )}
      </body>
    </html>
  );
}
