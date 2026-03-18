"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";

const items: Array<{ href: Route; label: string; icon: React.ReactNode }> = [
  { href: "/", label: "Dashboard", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg> },
  { href: "/bookings", label: "Bookings", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18M8 2v4M16 2v4"/></svg> },
  { href: "/conversations", label: "Conversations", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
  { href: "/courts", label: "Courts", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg> },
  { href: "/packages", label: "Packages", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" x2="12" y1="22.08" y2="12"/></svg> },
  { href: "/policies", label: "Policies", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg> },
  { href: "/admins", label: "Admins", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { href: "/audit", label: "Audit", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/></svg> },
  { href: "/agent-test-console", label: "Agent Lab", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg> }
];

export function ShellNav() {
  const pathname = usePathname();
  if (pathname === "/login") {
    return null;
  }

  return (
    <nav className="shell-nav" aria-label="Primary" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 'var(--sp-2)', 
      alignItems: 'flex-start',
      width: '100%',
      padding: '0 var(--sp-4)'
    }}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={pathname === item.href ? "active nav-item" : "nav-item"}
          aria-current={pathname === item.href ? "page" : undefined}
          title={item.label}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--sp-4)',
            width: '100%',
            height: '48px',
            padding: '0 var(--sp-3)',
            borderRadius: 'var(--radius-lg)',
            transition: 'all var(--dur-normal)',
            color: pathname === item.href ? 'var(--accent)' : 'var(--text-tertiary)',
            background: pathname === item.href ? 'rgba(0, 171, 150, 0.1)' : 'transparent',
            boxShadow: pathname === item.href ? '0 0 20px rgba(0, 171, 150, 0.15)' : 'none',
            border: pathname === item.href ? '1px solid rgba(0, 171, 150, 0.3)' : '1px solid transparent',
            overflow: 'hidden',
            whiteSpace: 'nowrap'
          }}
        >
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px' }}>
            {item.icon}
          </div>
          <span className="nav-label" style={{ 
            fontSize: 'var(--text-sm)', 
            fontWeight: 600,
            transition: 'opacity var(--dur-normal), transform var(--dur-normal)',
          }}>
            {item.label}
          </span>
        </Link>
      ))}
      <button className="nav-item" style={{ 
        marginTop: 'var(--sp-4)',
        width: '40px', 
        height: '40px', 
        borderRadius: '50%', 
        background: 'var(--surface-accent)', 
        border: 'none', 
        color: 'var(--text)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer'
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14"/></svg>
      </button>
    </nav>
  );
}
