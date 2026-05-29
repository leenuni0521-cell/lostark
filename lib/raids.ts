// 주간 레이드 정의. 골드 보상은 시즌/패치에 따라 바뀌므로 자유롭게 수정하세요.
// gold 단위: G (골드)

export interface RaidGate {
  label: string;
  gold: number;
}

export interface Raid {
  id: string;
  name: string;
  /** 추천 아이템 레벨 (표시용, 정렬용) */
  itemLevel: number;
  gates: RaidGate[];
}

// 상위 레이드부터 (아이템 레벨 내림차순). 골드 값은 대략치이니 편하게 고치세요.
export const RAIDS: Raid[] = [
  {
    id: "mordum",
    name: "3막 모르둠",
    itemLevel: 1680,
    gates: [
      { label: "1관문", gold: 3000 },
      { label: "2관문", gold: 3500 },
      { label: "3관문", gold: 4000 },
    ],
  },
  {
    id: "abrelshud_k",
    name: "2막 아브렐슈드",
    itemLevel: 1670,
    gates: [
      { label: "1관문", gold: 3500 },
      { label: "2관문", gold: 4750 },
    ],
  },
  {
    id: "aegir",
    name: "1막 에기르",
    itemLevel: 1660,
    gates: [
      { label: "1관문", gold: 2750 },
      { label: "2관문", gold: 3000 },
    ],
  },
  {
    id: "behemoth",
    name: "베히모스",
    itemLevel: 1640,
    gates: [
      { label: "1관문", gold: 2400 },
      { label: "2관문", gold: 2900 },
    ],
  },
  {
    id: "echidna",
    name: "에키드나",
    itemLevel: 1620,
    gates: [
      { label: "1관문", gold: 1600 },
      { label: "2관문", gold: 2400 },
    ],
  },
  {
    id: "kamen",
    name: "카멘",
    itemLevel: 1610,
    gates: [
      { label: "1관문", gold: 1000 },
      { label: "2관문", gold: 1200 },
      { label: "3관문", gold: 1800 },
    ],
  },
];

/** 레이드 관문 체크용 taskId */
export function gateTaskId(raidId: string, gateIndex: number): string {
  return `${raidId}__g${gateIndex}`;
}
