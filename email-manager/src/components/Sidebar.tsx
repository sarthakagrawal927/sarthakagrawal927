"use client";

import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import Link from "next/link";
import styles from "./Sidebar.module.css";

const navItems = [
  { href: "/", label: "Inbox", icon: "inbox" },
  { href: "/?label=STARRED", label: "Starred", icon: "star" },
  { href: "/?label=SENT", label: "Sent", icon: "send" },
  { href: "/?label=TRASH", label: "Trash", icon: "trash" },
];

function NavIcon({ icon }: { icon: string }) {
  switch (icon) {
    case "inbox":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="M22 4L12 13L2 4" />
        </svg>
      );
    case "star":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
    case "send":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      );
    case "trash":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
        </svg>
      );
    case "bell":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
      );
    default:
      return null;
  }
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <h2 className={styles.title}>Email Manager</h2>
        <Link href="/compose" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
          Compose
        </Link>
      </div>

      <nav className={styles.nav}>
        {navItems.map((item) => {
          const isActive =
            (item.href === "/" && pathname === "/" && !item.label.toLowerCase().includes("starred")) ||
            item.href.includes(pathname === "/" ? "INBOX" : "");
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`${styles.navItem} ${isActive ? styles.active : ""}`}
            >
              <NavIcon icon={item.icon} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <div className={styles.divider} />

        <Link href="/subscriptions" className={`${styles.navItem} ${pathname === "/subscriptions" ? styles.active : ""}`}>
          <NavIcon icon="bell" />
          <span>Subscriptions</span>
        </Link>
      </nav>

      <div className={styles.footer}>
        <button onClick={() => signOut()} className="btn btn-ghost" style={{ width: "100%", justifyContent: "center" }}>
          Sign out
        </button>
      </div>
    </aside>
  );
}
