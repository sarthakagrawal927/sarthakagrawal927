"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "./Toast";
import styles from "./ComposeForm.module.css";

export default function ComposeForm() {
  const router = useRouter();
  const toast = useToast();
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!to || !subject || !body) return;

    setSending(true);
    try {
      const res = await fetch("/api/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, body }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast("Email sent", "success");
      router.push("/");
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>New Message</h2>
        <button className="btn btn-ghost" onClick={() => router.back()}>
          Cancel
        </button>
      </div>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="to">To</label>
          <input
            id="to"
            type="email"
            required
            placeholder="recipient@example.com"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="subject">Subject</label>
          <input
            id="subject"
            type="text"
            required
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="body">Message</label>
          <textarea
            id="body"
            required
            rows={14}
            placeholder="Write your message..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>
        <div className={styles.actions}>
          <button type="submit" className="btn btn-primary" disabled={sending}>
            {sending ? "Sending..." : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}
