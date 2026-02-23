import { NextRequest, NextResponse } from "next/server";
import { getAccessToken } from "@/lib/session";
import { getEmail, modifyEmail, trashEmail } from "@/lib/gmail";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const email = await getEmail(token, id);
    return NextResponse.json(email);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { action } = body;

  try {
    switch (action) {
      case "read":
        await modifyEmail(token, id, undefined, ["UNREAD"]);
        break;
      case "unread":
        await modifyEmail(token, id, ["UNREAD"]);
        break;
      case "star":
        await modifyEmail(token, id, ["STARRED"]);
        break;
      case "unstar":
        await modifyEmail(token, id, undefined, ["STARRED"]);
        break;
      case "archive":
        await modifyEmail(token, id, undefined, ["INBOX"]);
        break;
      case "trash":
        await trashEmail(token, id);
        break;
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
