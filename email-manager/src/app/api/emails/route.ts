import { NextRequest, NextResponse } from "next/server";
import { getAccessToken } from "@/lib/session";
import { listEmails } from "@/lib/gmail";

export async function GET(req: NextRequest) {
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = req.nextUrl.searchParams;
  const query = params.get("query") ?? undefined;
  const label = params.get("label") ?? undefined;
  const maxResults = params.get("maxResults")
    ? parseInt(params.get("maxResults")!, 10)
    : 20;
  const pageToken = params.get("pageToken") ?? undefined;

  try {
    const result = await listEmails(token, {
      query,
      labelIds: label ? [label] : undefined,
      maxResults,
      pageToken,
    });
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
