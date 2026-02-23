import { NextRequest, NextResponse } from "next/server";
import { getAccessToken } from "@/lib/session";
import { listSubscriptions } from "@/lib/gmail";

export async function GET(req: NextRequest) {
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pageToken = req.nextUrl.searchParams.get("pageToken") ?? undefined;

  try {
    const result = await listSubscriptions(token, pageToken);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
