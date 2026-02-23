"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "./Toast";
import styles from "./EmailDetail.module.css";

interface EmailData {
  id: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  body: string;
  isRead: boolean;
  isStarred: boolean;
  hasUnsubscribe: boolean;
  unsubscribeLink: string | null;
  unsubscribeEmail: string | null;
}

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleString();
  } catch {
    return dateStr;
  }
}

export default function EmailDetail({ id }: { id: string }) {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState<EmailData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/emails/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setEmail(data);

        if (!data.isRead) {
          await fetch(`/api/emails/${id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "read" }),
          });
        }
      } catch (err: any) {
        toast(err.message, "error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, toast]);

  const doAction = async (action: string, message: string) => {
    try {
      const res = await fetch(`/api/emails/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      toast(message, "success");
      if (action === "star" || action === "unstar") {
        setEmail((prev) => (prev ? { ...prev, isStarred: action === "star" } : prev));
      } else {
        router.back();
      }
    } catch (err: any) {
      toast(err.message, "error");
    }
  };

  const handleUnsubscribe = async () => {
    if (!email) return;
    if (email.unsubscribeLink) {
      window.open(email.unsubscribeLink, "_blank");
      toast("Opened unsubscribe link in new tab", "info");
    } else if (email.unsubscribeEmail) {
      try {
        const res = await fetch("/api/emails/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: email.unsubscribeEmail,
            subject: "Unsubscribe",
            body: "Please unsubscribe me from this mailing list.",
          }),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        toast("Unsubscribe email sent", "success");
      } catch (err: any) {
        toast(err.message, "error");
      }
    }
  };

  if (loading) {
    return (
      <div className={styles.state}>
        <div className="spinner" />
        <p>Loading email...</p>
      </div>
    );
  }

  if (!email) {
    return (
      <div className={styles.state}>
        <p>Email not found</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className="btn btn-ghost" onClick={() => router.back()}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back
        </button>
        <div className={styles.actions}>
          <button
            className={`btn-icon ${email.isStarred ? styles.starred : ""}`}
            title="Star"
            onClick={() => doAction(email.isStarred ? "unstar" : "star", email.isStarred ? "Unstarred" : "Starred")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={email.isStarred ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
          <button className="btn-icon" title="Archive" onClick={() => doAction("archive", "Archived")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="21 8 21 21 3 21 3 8" />
              <rect x="1" y="3" width="22" height="5" />
              <line x1="10" y1="12" x2="14" y2="12" />
            </svg>
          </button>
          <button className="btn-icon" title="Delete" onClick={() => doAction("trash", "Moved to trash")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
          </button>
          <button className="btn-icon" title="Mark unread" onClick={() => doAction("unread", "Marked as unread")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M22 4L12 13L2 4" />
            </svg>
          </button>
        </div>
      </div>

      <div className={styles.body}>
        <h2 className={styles.subject}>{email.subject}</h2>
        <div className={styles.meta}>
          <span className={styles.from}>{email.from}</span>
          <span className={styles.date}>{formatDate(email.date)}</span>
        </div>

        {email.hasUnsubscribe && (
          <div className={styles.unsubscribe}>
            <span>This sender supports unsubscribe.</span>
            <button className="btn btn-danger" onClick={handleUnsubscribe}>
              Unsubscribe
            </button>
          </div>
        )}

        <div
          className={styles.content}
          dangerouslySetInnerHTML={{
            __html:
              email.body.includes("<") && email.body.includes(">")
                ? email.body
                : `<pre style="white-space:pre-wrap;font-family:inherit">${email.body.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>`,
          }}
        />
      </div>
    </div>
  );
}
