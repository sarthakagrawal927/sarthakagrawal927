import { gmail_v1, google } from "googleapis";

const gmail = google.gmail("v1");

export interface EmailSummary {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  snippet: string;
  date: string;
  isRead: boolean;
  isStarred: boolean;
  labelIds: string[];
}

export interface EmailDetail extends EmailSummary {
  body: string;
  hasUnsubscribe: boolean;
  unsubscribeLink: string | null;
  unsubscribeEmail: string | null;
}

function getHeader(
  headers: gmail_v1.Schema$MessagePartHeader[] | undefined,
  name: string
): string {
  return (
    headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? ""
  );
}

function decodeBase64Url(data: string): string {
  return Buffer.from(
    data.replace(/-/g, "+").replace(/_/g, "/"),
    "base64"
  ).toString("utf-8");
}

function extractBody(payload: gmail_v1.Schema$MessagePart | undefined): string {
  if (!payload) return "";

  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  if (payload.parts) {
    const htmlPart = payload.parts.find((p) => p.mimeType === "text/html");
    if (htmlPart?.body?.data) return decodeBase64Url(htmlPart.body.data);

    const textPart = payload.parts.find((p) => p.mimeType === "text/plain");
    if (textPart?.body?.data) return decodeBase64Url(textPart.body.data);

    for (const part of payload.parts) {
      const body = extractBody(part);
      if (body) return body;
    }
  }

  return "";
}

function parseUnsubscribe(headers: gmail_v1.Schema$MessagePartHeader[] | undefined) {
  const header = getHeader(headers, "List-Unsubscribe");
  if (!header) {
    return { hasUnsubscribe: false, unsubscribeLink: null, unsubscribeEmail: null };
  }

  let link: string | null = null;
  let email: string | null = null;

  const matches = header.match(/<([^>]+)>/g);
  if (matches) {
    for (const m of matches) {
      const val = m.slice(1, -1);
      if (val.startsWith("http")) link = val;
      else if (val.startsWith("mailto:")) email = val.replace("mailto:", "");
    }
  }

  return { hasUnsubscribe: true, unsubscribeLink: link, unsubscribeEmail: email };
}

function parseMessage(
  msg: gmail_v1.Schema$Message,
  full = false
): EmailSummary | EmailDetail {
  const headers = msg.payload?.headers;
  const labels = msg.labelIds ?? [];

  const base: EmailSummary = {
    id: msg.id!,
    threadId: msg.threadId!,
    from: getHeader(headers, "From"),
    to: getHeader(headers, "To"),
    subject: getHeader(headers, "Subject") || "(no subject)",
    snippet: msg.snippet ?? "",
    date: getHeader(headers, "Date"),
    isRead: !labels.includes("UNREAD"),
    isStarred: labels.includes("STARRED"),
    labelIds: labels,
  };

  if (!full) return base;

  return {
    ...base,
    body: extractBody(msg.payload),
    ...parseUnsubscribe(headers),
  };
}

function makeAuth(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return auth;
}

export async function listEmails(
  accessToken: string,
  options: {
    query?: string;
    labelIds?: string[];
    maxResults?: number;
    pageToken?: string;
  } = {}
) {
  const auth = makeAuth(accessToken);

  const res = await gmail.users.messages.list({
    auth,
    userId: "me",
    q: options.query,
    labelIds: options.labelIds,
    maxResults: options.maxResults ?? 20,
    pageToken: options.pageToken,
  });

  if (!res.data.messages?.length) {
    return { emails: [] as EmailSummary[], nextPageToken: null };
  }

  const emails = await Promise.all(
    res.data.messages.map(async (m) => {
      const full = await gmail.users.messages.get({
        auth,
        userId: "me",
        id: m.id!,
        format: "metadata",
        metadataHeaders: ["From", "To", "Subject", "Date"],
      });
      return parseMessage(full.data) as EmailSummary;
    })
  );

  return { emails, nextPageToken: res.data.nextPageToken ?? null };
}

export async function getEmail(
  accessToken: string,
  messageId: string
): Promise<EmailDetail> {
  const auth = makeAuth(accessToken);
  const res = await gmail.users.messages.get({
    auth,
    userId: "me",
    id: messageId,
    format: "full",
  });
  return parseMessage(res.data, true) as EmailDetail;
}

export async function modifyEmail(
  accessToken: string,
  messageId: string,
  addLabelIds?: string[],
  removeLabelIds?: string[]
) {
  const auth = makeAuth(accessToken);
  await gmail.users.messages.modify({
    auth,
    userId: "me",
    id: messageId,
    requestBody: { addLabelIds, removeLabelIds },
  });
}

export async function trashEmail(accessToken: string, messageId: string) {
  const auth = makeAuth(accessToken);
  await gmail.users.messages.trash({ auth, userId: "me", id: messageId });
}

export async function sendEmail(
  accessToken: string,
  to: string,
  subject: string,
  body: string
) {
  const auth = makeAuth(accessToken);
  const raw = Buffer.from(
    `To: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/plain; charset="UTF-8"\r\n\r\n${body}`
  )
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const res = await gmail.users.messages.send({
    auth,
    userId: "me",
    requestBody: { raw },
  });
  return res.data.id!;
}

export async function listSubscriptions(
  accessToken: string,
  pageToken?: string
) {
  const auth = makeAuth(accessToken);

  const res = await gmail.users.messages.list({
    auth,
    userId: "me",
    q: "unsubscribe",
    maxResults: 50,
    pageToken,
  });

  if (!res.data.messages?.length) {
    return { senders: [] as any[], nextPageToken: null };
  }

  const details = await Promise.all(
    res.data.messages.map(async (m) => {
      const full = await gmail.users.messages.get({
        auth,
        userId: "me",
        id: m.id!,
        format: "metadata",
        metadataHeaders: ["From", "List-Unsubscribe"],
      });
      return full.data;
    })
  );

  const senderMap = new Map<
    string,
    {
      name: string;
      email: string;
      count: number;
      unsubscribeLink: string | null;
      unsubscribeEmail: string | null;
    }
  >();

  for (const msg of details) {
    const from = getHeader(msg.payload?.headers, "From");
    const emailMatch = from.match(/<([^>]+)>/);
    const email = emailMatch ? emailMatch[1] : from;
    const name =
      from
        .replace(/<[^>]+>/, "")
        .trim()
        .replace(/"/g, "") || email;

    const unsub = parseUnsubscribe(msg.payload?.headers);
    if (unsub.hasUnsubscribe) {
      const existing = senderMap.get(email);
      if (existing) {
        existing.count++;
      } else {
        senderMap.set(email, {
          name,
          email,
          count: 1,
          unsubscribeLink: unsub.unsubscribeLink,
          unsubscribeEmail: unsub.unsubscribeEmail,
        });
      }
    }
  }

  return {
    senders: Array.from(senderMap.values()).sort((a, b) => b.count - a.count),
    nextPageToken: res.data.nextPageToken ?? null,
  };
}
