// 로스트아크(한국 서버) 컨텐츠 리셋 기준
// - 일일: 매일 06:00
// - 주간: 매주 수요일 06:00
// 모든 시간은 KST(UTC+9) 기준으로 계산한다.

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const RESET_HOUR = 6;

/** 현재 시각을 KST 기준 Date(로 보이는 UTC Date)로 변환 */
function nowKst(): Date {
  return new Date(Date.now() + KST_OFFSET_MS);
}

/**
 * 현재 "게임 일자" 키 (예: "2026-05-29").
 * 06:00 이전이면 전날에 속한다.
 */
export function dailyPeriodKey(): string {
  const d = nowKst();
  if (d.getUTCHours() < RESET_HOUR) {
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return d.toISOString().slice(0, 10);
}

/**
 * 현재 "게임 주간" 키 = 가장 최근 수요일 06:00의 날짜 (예: "2026-05-27").
 */
export function weeklyPeriodKey(): string {
  const d = nowKst();
  // 06시 이전이면 아직 전날의 게임일
  if (d.getUTCHours() < RESET_HOUR) {
    d.setUTCDate(d.getUTCDate() - 1);
  }
  // getUTCDay: 0=일 ... 3=수
  const day = d.getUTCDay();
  const diff = (day - 3 + 7) % 7; // 직전 수요일까지의 일수
  d.setUTCDate(d.getUTCDate() - diff);
  return d.toISOString().slice(0, 10);
}

/** 다음 일일 리셋까지 남은 시간 (사람이 읽는 문자열) */
export function timeUntilDailyReset(): string {
  const d = nowKst();
  const next = new Date(d);
  next.setUTCHours(RESET_HOUR, 0, 0, 0);
  if (d.getUTCHours() >= RESET_HOUR) {
    next.setUTCDate(next.getUTCDate() + 1);
  }
  return formatDuration(next.getTime() - d.getTime());
}

function formatDuration(ms: number): string {
  const totalMin = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}시간 ${m}분`;
}
