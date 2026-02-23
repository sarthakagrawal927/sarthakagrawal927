"use client";

import { useState, useEffect } from "react";
import { useToast } from "./Toast";
import styles from "./SubscriptionsList.module.css";

interface Subscription {
  name: string;
  email: string;
  count: number;
  unsubscribeLink: string | null;
  unsubscribeEmail: string | null;
}

export default function SubscriptionsList() {
  const toast = useToast();
  const [senders, setSenders] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [sentEmails, setSentEmails] = useState<Set<string>>(new Set());

  const fetchSubs = async (reset = true, pageToken?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (pageToken) params.set("pageToken", pageToken);

      const res = await fetch(`/api/subscriptions?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (reset) {
        setSenders(data.senders);
      } else {
        setSenders((prev) => [...prev, ...data.senders]);
      }
      setNextPageToken(data.nextPageToken);
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubs(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUnsubEmail = async (email: string) => {
    try {
      const res = await fetch("/api/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: email,
          subject: "Unsubscribe",
          body: "Please unsubscribe me from this mailing list.",
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setSentEmails((prev) => new Set(prev).add(email));
      toast(`Unsubscribe email sent to ${email}`, "success");
    } catch (err: any) {
      toast(err.message, "error");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Subscriptions</h2>
        <p>Emails containing unsubscribe links. Click to unsubscribe.</p>
      </div>

      <div className={styles.list}>
        {senders.map((sub) => (
          <div key={sub.email} className={styles.row}>
            <div className={styles.info}>
              <span className={styles.name}>{sub.name}</span>
              <span className={styles.email}>{sub.email}</span>
              <span className={styles.count}>
                {sub.count} email{sub.count !== 1 ? "s" : ""}
              </span>
            </div>
            <div className={styles.actions}>
              {sub.unsubscribeLink ? (
                <a
                  href={sub.unsubscribeLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-danger"
                >
                  Unsubscribe
                </a>
              ) : sub.unsubscribeEmail ? (
                sentEmails.has(sub.unsubscribeEmail) ? (
                  <button className="btn" style={{ background: "var(--success)", color: "white" }} disabled>
                    Sent
                  </button>
                ) : (
                  <button
                    className="btn btn-danger"
                    onClick={() => handleUnsubEmail(sub.unsubscribeEmail!)}
                  >
                    Unsubscribe
                  </button>
                )
              ) : (
                <span className={styles.noLink}>No link</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {loading && (
        <div className={styles.state}>
          <div className="spinner" />
          <p>Scanning for subscriptions...</p>
        </div>
      )}

      {!loading && senders.length === 0 && (
        <div className={styles.state}>
          <p>No subscriptions found</p>
        </div>
      )}

      {!loading && nextPageToken && (
        <div className={styles.loadMore}>
          <button className="btn btn-ghost" onClick={() => fetchSubs(false, nextPageToken)}>
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
