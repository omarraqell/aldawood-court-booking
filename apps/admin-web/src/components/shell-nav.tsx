"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";

const items: Array<{ href: Route; label: string; note: string }> = [
  { href: "/", label: "Dashboard", note: "Queue health, KPIs, and next actions" },
  { href: "/bookings", label: "Bookings", note: "Reservations and linked packages" },
  { href: "/conversations", label: "Conversations", note: "Agent inbox and transcripts" },
  { href: "/courts", label: "Courts", note: "Inventory, blocks, and pricing inputs" },
  { href: "/packages", label: "Packages", note: "Event catalog and offer defaults" },
  { href: "/policies", label: "Policies", note: "Lead times, cutoffs, and hours" },
  { href: "/admins", label: "Admins", note: "Back-office operator roster" },
  { href: "/audit", label: "Audit", note: "Recent backend mutations" },
  { href: "/agent-test-console", label: "Agent Lab", note: "Internal conversation testing" }
];

export function ShellNav() {
  const pathname = usePathname();
  if (pathname === "/login") {
    return null;
  }

  return (
    <nav className="shell-nav" aria-label="Primary">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={pathname === item.href ? "active" : ""}
          aria-current={pathname === item.href ? "page" : undefined}
        >
          <span className="shell-nav__label">{item.label}</span>
          <small>{item.note}</small>
        </Link>
      ))}
    </nav>
  );
}
