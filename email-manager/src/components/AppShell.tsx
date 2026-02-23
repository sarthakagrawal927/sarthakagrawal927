"use client";

import { useSession } from "next-auth/react";
import Sidebar from "./Sidebar";
import AuthScreen from "./AuthScreen";
import styles from "./AppShell.module.css";
import { ReactNode } from "react";

export default function AppShell({ children }: { children: ReactNode }) {
  const { status } = useSession();

  if (status === "loading") {
    return (
      <div className={styles.loading}>
        <div className="spinner" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return <AuthScreen />;
  }

  return (
    <div className={styles.shell}>
      <Sidebar />
      <main className={styles.main}>{children}</main>
    </div>
  );
}
