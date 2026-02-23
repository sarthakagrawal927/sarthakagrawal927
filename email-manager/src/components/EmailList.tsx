"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "./Toast";
import styles from "./EmailList.module.css";

interface Email {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  date: string;
  isRead: boolean;
  isStarred: boolean;
}

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    if (d.getFullYear() === now.getFullYear()) {
      return d.toLocaleDateString([], { month: "short", day: "numeric" });
    }
    return d.toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

function extractName(from: string) {
  if (!from) return "Unknown";
  const match = from.match(/^"?([^"<]+)"?\s*</);
  return match ? match[1].trim() : from.split("@")[0];
}

export default function EmailList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const label = searchParams.get("label") || "INBOX";

  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searchTimeout, setSearchTimeoutState] = useState<NodeJS.Timeout | null>(null);

  const fetchEmails = useCallback(
    async (reset = true, pageToken?: string) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("label", label);
        if (search) params.set("query", search);
        if (pageToken) params.set("pageToken", pageToken);
        params.set("maxResults", "20");

        const res = await fetch(`/api/emails?${params}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        if (reset) {
          setEmails(data.emails);
        } else {
          setEmails((prev) => [...prev, ...data.emails]);
        }
        setNextPageToken(data.nextPageToken);
      } catch (err: any) {
        toast(err.message, "error");
      } finally {
        setLoading(false);
      }
    },
    [label, search, toast]
  );

  useEffect(() => {
    fetchEmails(true);
  }, [fetchEmails]);

  const handleSearch = (value: string) => {
    setSearch(value);
    if (searchTimeout) clearTimeout(searchTimeout);
    setSearchTimeoutState(
      setTimeout(() => {
        fetchEmails(true);
      }, 400)
    );
  };

  const toggleStar = async (e: React.MouseEvent, email: Email) => {
    e.stopPropagation();
    try {
      await fetch(`/api/emails/${email.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: email.isStarred ? "unstar" : "star" }),
      });
      setEmails((prev) =>
        prev.map((em) =>
          em.id === email.id ? { ...em, isStarred: !em.isStarred } : em
        )
      );
    } catch (err: any) {
      toast(err.message, "error");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.searchBar}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search emails..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.list}>
        {emails.map((email) => (
          <div
            key={email.id}
            className={`${styles.row} ${!email.isRead ? styles.unread : ""}`}
            onClick={() => router.push(`/email/${email.id}`)}
          >
            <button
              className={`${styles.star} ${email.isStarred ? styles.starred : ""}`}
              onClick={(e) => toggleStar(e, email)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill={email.isStarred ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </button>
            <div className={styles.content}>
              <div className={styles.topRow}>
                <span className={styles.from}>{extractName(email.from)}</span>
                <span className={styles.date}>{formatDate(email.date)}</span>
              </div>
              <div className={styles.subject}>{email.subject}</div>
              <div className={styles.snippet}>{email.snippet}</div>
            </div>
          </div>
        ))}

        {loading && (
          <div className={styles.state}>
            <div className="spinner" />
            <p>Loading emails...</p>
          </div>
        )}

        {!loading && emails.length === 0 && (
          <div className={styles.state}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M22 4L12 13L2 4" />
            </svg>
            <p>No emails found</p>
          </div>
        )}

        {!loading && nextPageToken && (
          <div className={styles.loadMore}>
            <button className="btn btn-ghost" onClick={() => fetchEmails(false, nextPageToken)}>
              Load more
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
