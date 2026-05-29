import { NextResponse } from "next/server";
import { getSiblings, LostArkApiError } from "@/lib/lostark";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  try {
    const data = await getSiblings(decodeURIComponent(name));
    return NextResponse.json(data ?? []);
  } catch (err) {
    const status = err instanceof LostArkApiError ? err.status : 500;
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status });
  }
}
