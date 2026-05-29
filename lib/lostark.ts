// 로스트아크 오픈 API 호출 헬퍼 (서버 전용)
// 이 파일은 절대 클라이언트 번들에 포함되면 안 됩니다. (API 키 노출 방지)

const BASE_URL = "https://developer-lostark.game.onstove.com";

export class LostArkApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "LostArkApiError";
  }
}

function getToken(): string {
  const token = process.env.LOSTARK_API_KEY;
  if (!token || token.trim() === "" || token.includes("여기에")) {
    throw new LostArkApiError(
      500,
      "LOSTARK_API_KEY 환경변수가 설정되지 않았습니다. .env.local 파일을 확인하세요.",
    );
  }
  return token.trim();
}

/**
 * 로스트아크 API GET 요청.
 * @param path 예: "/armories/characters/캐릭터명"
 */
export async function lostarkGet<T>(path: string): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      accept: "application/json",
      authorization: `bearer ${token}`,
    },
    // 캐릭터 데이터는 자주 바뀌지 않으므로 60초간 캐시
    next: { revalidate: 60 },
  });

  if (res.status === 401) {
    throw new LostArkApiError(401, "API 키가 유효하지 않습니다. 토큰을 다시 확인하세요.");
  }
  if (res.status === 404) {
    throw new LostArkApiError(404, "존재하지 않는 캐릭터입니다.");
  }
  if (res.status === 429) {
    throw new LostArkApiError(429, "API 호출 한도를 초과했습니다. 잠시 후 다시 시도하세요.");
  }
  if (!res.ok) {
    throw new LostArkApiError(res.status, `API 오류 (status ${res.status})`);
  }

  // 204 No Content 등 빈 응답 처리
  const text = await res.text();
  if (!text) return null as T;
  return JSON.parse(text) as T;
}

const encode = (name: string) => encodeURIComponent(name.trim());

/** 캐릭터 전투정보실 전체 (프로필/장비/스킬 등) */
export function getArmory(name: string) {
  return lostarkGet<ArmoryFull>(`/armories/characters/${encode(name)}`);
}

/** 원정대(같은 계정의 보유 캐릭터) 목록 */
export function getSiblings(name: string) {
  return lostarkGet<Sibling[]>(`/characters/${encode(name)}/siblings`);
}

// ---- 응답 타입 (필요한 필드만) ----

export interface Sibling {
  ServerName: string;
  CharacterName: string;
  CharacterLevel: number;
  CharacterClassName: string;
  ItemAvgLevel: string;
  ItemMaxLevel: string;
}

export interface ArmoryProfile {
  CharacterImage: string | null;
  ExpeditionLevel: number;
  PvpGradeName: string;
  TownLevel: number | null;
  TownName: string | null;
  Title: string | null;
  GuildMemberGrade: string | null;
  GuildName: string | null;
  ServerName: string;
  CharacterName: string;
  CharacterLevel: number;
  CharacterClassName: string;
  ItemAvgLevel: string;
  ItemMaxLevel: string;
  Stats: { Type: string; Value: string; Tooltip: string[] }[] | null;
}

export interface ArmoryEquipmentItem {
  Type: string;
  Name: string;
  Icon: string;
  Grade: string;
  Tooltip: string;
}

export interface ArmoryFull {
  ArmoryProfile: ArmoryProfile | null;
  ArmoryEquipment: ArmoryEquipmentItem[] | null;
}
