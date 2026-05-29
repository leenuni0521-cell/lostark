import { NextResponse } from "next/server";
import { getProfile, LostArkApiError } from "@/lib/lostark";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  try {
    const profile = await getProfile(decodeURIComponent(name));
    if (!profile) {
      return NextResponse.json({ error: "존재하지 않는 캐릭터입니다." }, { status: 404 });
    }
    // 필요한 필드만 추려서 반환 (페이로드 최소화)
    return NextResponse.json({
      name: profile.CharacterName,
      server: profile.ServerName,
      className: profile.CharacterClassName,
      level: profile.CharacterLevel,
      itemLevel: profile.ItemMaxLevel || profile.ItemAvgLevel || null,
      image: profile.CharacterImage,
    });
  } catch (err) {
    const status = err instanceof LostArkApiError ? err.status : 500;
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status });
  }
}
