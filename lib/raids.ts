// 주간 레이드 정의 (난이도별 관문 골드).
// 골드 값은 패치에 따라 바뀌므로 자유롭게 수정하세요. (출처: loawa 참고 수치)

export interface RaidGate {
  label: string;
  gold: number;
}

export interface RaidDifficulty {
  id: string;
  label: string;
  gates: RaidGate[];
}

export interface Raid {
  id: string;
  name: string;
  /** 표시/정렬용 추천 아이템 레벨 */
  itemLevel: number;
  difficulties: RaidDifficulty[];
}

// 상위(최신) 레이드부터 정렬
export const RAIDS: Raid[] = [
  {
    id: "serka",
    name: "세르카",
    itemLevel: 1720,
    difficulties: [
      { id: "normal", label: "노말", gates: [
        { label: "1관문", gold: 7000 }, { label: "2관문", gold: 10500 } ] },
      { id: "hard", label: "하드", gates: [
        { label: "1관문", gold: 17500 }, { label: "2관문", gold: 26500 } ] },
      { id: "nightmare", label: "나이트메어", gates: [
        { label: "1관문", gold: 21000 }, { label: "2관문", gold: 33000 } ] },
    ],
  },
  {
    id: "kazeros_final",
    name: "종막 카제로스",
    itemLevel: 1710,
    difficulties: [
      { id: "normal", label: "노말", gates: [
        { label: "1관문", gold: 7000 }, { label: "2관문", gold: 13000 } ] },
      { id: "hard", label: "하드", gates: [
        { label: "1관문", gold: 17500 }, { label: "2관문", gold: 35000 } ] },
    ],
  },
  {
    id: "armoche",
    name: "4막 아르모체",
    itemLevel: 1700,
    difficulties: [
      { id: "normal", label: "노말", gates: [
        { label: "1관문", gold: 6250 }, { label: "2관문", gold: 10250 } ] },
      { id: "hard", label: "하드", gates: [
        { label: "1관문", gold: 15000 }, { label: "2관문", gold: 27000 } ] },
    ],
  },
  {
    id: "cathedral",
    name: "지평의 성당",
    itemLevel: 1690,
    difficulties: [
      { id: "stage1", label: "1단계", gates: [
        { label: "1관문", gold: 13500 }, { label: "2관문", gold: 16500 } ] },
      { id: "stage2", label: "2단계", gates: [
        { label: "1관문", gold: 16000 }, { label: "2관문", gold: 24000 } ] },
      { id: "stage3", label: "3단계", gates: [
        { label: "1관문", gold: 20000 }, { label: "2관문", gold: 30000 } ] },
    ],
  },
  {
    id: "mordum",
    name: "3막 모르둠",
    itemLevel: 1680,
    difficulties: [
      { id: "single", label: "싱글", gates: [
        { label: "1관문", gold: 2000 }, { label: "2관문", gold: 3500 }, { label: "3관문", gold: 5000 } ] },
      { id: "normal", label: "노말", gates: [
        { label: "1관문", gold: 2000 }, { label: "2관문", gold: 3500 }, { label: "3관문", gold: 5000 } ] },
      { id: "hard", label: "하드", gates: [
        { label: "1관문", gold: 2500 }, { label: "2관문", gold: 4000 }, { label: "3관문", gold: 7000 } ] },
    ],
  },
  {
    id: "abrelshud_k",
    name: "2막 아브렐슈드",
    itemLevel: 1670,
    difficulties: [
      { id: "single", label: "싱글", gates: [
        { label: "1관문", gold: 2750 }, { label: "2관문", gold: 5500 } ] },
      { id: "normal", label: "노말", gates: [
        { label: "1관문", gold: 2750 }, { label: "2관문", gold: 5500 } ] },
      { id: "hard", label: "하드", gates: [
        { label: "1관문", gold: 3750 }, { label: "2관문", gold: 7750 } ] },
    ],
  },
  {
    id: "aegir",
    name: "1막 에기르",
    itemLevel: 1660,
    difficulties: [
      { id: "single", label: "싱글", gates: [
        { label: "1관문", gold: 1750 }, { label: "2관문", gold: 4000 } ] },
      { id: "normal", label: "노말", gates: [
        { label: "1관문", gold: 1750 }, { label: "2관문", gold: 4000 } ] },
      { id: "hard", label: "하드", gates: [
        { label: "1관문", gold: 2750 }, { label: "2관문", gold: 6250 } ] },
    ],
  },
  {
    id: "behemoth",
    name: "베히모스",
    itemLevel: 1640,
    difficulties: [
      { id: "normal", label: "노말", gates: [
        { label: "1관문", gold: 1100 }, { label: "2관문", gold: 2500 } ] },
    ],
  },
  {
    id: "echidna",
    name: "에키드나",
    itemLevel: 1620,
    difficulties: [
      { id: "single", label: "싱글", gates: [
        { label: "1관문", gold: 1900 }, { label: "2관문", gold: 4200 } ] },
      { id: "normal", label: "노말", gates: [
        { label: "1관문", gold: 1900 }, { label: "2관문", gold: 4200 } ] },
      { id: "hard", label: "하드", gates: [
        { label: "1관문", gold: 1100 }, { label: "2관문", gold: 2500 } ] },
    ],
  },
];

/** 레이드 관문 체크용 taskId (난이도 포함) */
export function gateTaskId(raidId: string, diffId: string, gateIndex: number): string {
  return `${raidId}__${diffId}__g${gateIndex}`;
}

/** 기본 난이도 (노말 우선, 없으면 첫 번째) */
export function defaultDifficulty(raid: Raid): string {
  return (raid.difficulties.find((d) => d.id === "normal") ?? raid.difficulties[0]).id;
}

export function getDifficulty(raid: Raid, diffId: string): RaidDifficulty {
  return raid.difficulties.find((d) => d.id === diffId) ?? raid.difficulties[0];
}
