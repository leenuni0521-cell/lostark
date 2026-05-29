import { NextResponse } from "next/server";
import { getArmory, LostArkApiError } from "@/lib/lostark";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  try {
    const data = await getArmory(decodeURIComponent(name));
    if (!data || !data.ArmoryProfile) {
      return NextResponse.json({ error: "존재하지 않는 캐릭터입니다." }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (err) {
    const status = err instanceof LostArkApiError ? err.status : 500;
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status });
  }
}
