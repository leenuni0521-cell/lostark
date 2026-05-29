// 숙제 항목 정의. 보상 골드 등은 시즌에 따라 바뀌므로 자유롭게 수정하세요.

export interface TaskDef {
  id: string;
  label: string;
}

// 캐릭터별 일일 숙제
export const DAILY_TASKS: TaskDef[] = [
  { id: "chaos", label: "카오스 던전" },
  { id: "guardian", label: "가디언 토벌" },
  { id: "epona", label: "일일 에포나 의뢰" },
];

// 캐릭터별 주간 숙제 (레이드 등)
export const WEEKLY_TASKS: TaskDef[] = [
  { id: "raid1", label: "레이드 1관문" },
  { id: "raid2", label: "레이드 2관문" },
  { id: "raid3", label: "레이드 3관문" },
  { id: "guardian_weekly", label: "주간 가디언" },
  { id: "una", label: "주간 에포나 의뢰" },
];

// 원정대(계정) 단위 주간 숙제
export const ACCOUNT_WEEKLY_TASKS: TaskDef[] = [
  { id: "guild", label: "길드 출석/기부" },
  { id: "shop", label: "주간 상점 구매" },
];
