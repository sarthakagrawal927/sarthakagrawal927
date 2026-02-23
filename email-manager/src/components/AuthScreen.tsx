"use client";

import { signIn } from "next-auth/react";
import styles from "./AuthScreen.module.css";

export default function AuthScreen() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.icon}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M22 4L12 13L2 4" />
          </svg>
        </div>
        <h1>Email Manager</h1>
        <p className={styles.subtitle}>
          Manage your Gmail inbox, unsubscribe from newsletters, and stay organized.
        </p>
        <button className="btn btn-primary btn-lg" onClick={() => signIn("google")}>
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
