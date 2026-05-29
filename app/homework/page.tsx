"use client";

import { useEffect, useState } from "react";
import { parseItemLevel, type Sibling } from "@/lib/lostark";
import { DAILY_TASKS, WEEKLY_TASKS, ACCOUNT_WEEKLY_TASKS } from "@/lib/tasks";
import {
  RAIDS,
  gateTaskId,
  defaultDifficulty,
  getDifficulty,
  type Raid,
} from "@/lib/raids";
import { dailyPeriodKey, weeklyPeriodKey, timeUntilDailyReset } from "@/lib/reset";

interface CharInfo {
  name: string;
  server?: string;
  className?: string;
  itemLevel?: string | null;
  combatPower?: string | null;
  image?: string | null;
}

type TaskMap = Record<string, boolean>;
type ScopeMap = Record<string, TaskMap>;

interface PeriodState {
  period: string;
  data: ScopeMap;
}

// charName -> raidId -> difficultyId
type RaidDiffMap = Record<string, Record<string, string>>;

const CHARS_KEY = "loa.chars";
const DAILY_KEY = "loa.daily";
const WEEKLY_KEY = "loa.weekly";
const RAIDDIFF_KEY = "loa.raiddiff";
const ACCOUNT_SCOPE = "__account__";

function loadPeriod(key: string, currentPeriod: string): PeriodState {
  if (typeof window === "undefined") return { period: currentPeriod, data: {} };
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as PeriodState;
      if (parsed.period === currentPeriod) return parsed;
    }
  } catch {
    /* ignore */
  }
  return { period: currentPeriod, data: {} };
}

async function fetchProfiles(names: string[]): Promise<Map<string, Partial<CharInfo>>> {
  const result = new Map<string, Partial<CharInfo>>();
  await Promise.all(
    names.map(async (n) => {
      try {
        const res = await fetch(`/api/profile/${encodeURIComponent(n)}`);
        if (!res.ok) return;
        const p = await res.json();
        result.set(n, {
          image: p.image ?? null,
          className: p.className,
          itemLevel: p.itemLevel,
          combatPower: p.combatPower ?? null,
          server: p.server,
        });
      } catch {
        /* ignore */
      }
    }),
  );
  return result;
}

export default function HomeworkPage() {
  const [chars, setChars] = useState<CharInfo[]>([]);
  const [daily, setDaily] = useState<PeriodState>({ period: "", data: {} });
  const [weekly, setWeekly] = useState<PeriodState>({ period: "", data: {} });
  const [raidDiff, setRaidDiff] = useState<RaidDiffMap>({});
  const [input, setInput] = useState("");
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetIn, setResetIn] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const rawChars = localStorage.getItem(CHARS_KEY);
      if (rawChars) setChars(JSON.parse(rawChars));
      const rawDiff = localStorage.getItem(RAIDDIFF_KEY);
      if (rawDiff) setRaidDiff(JSON.parse(rawDiff));
    } catch {
      /* ignore */
    }
    setDaily(loadPeriod(DAILY_KEY, dailyPeriodKey()));
    setWeekly(loadPeriod(WEEKLY_KEY, weeklyPeriodKey()));
    setResetIn(timeUntilDailyReset());
    setReady(true);
    const t = setInterval(() => setResetIn(timeUntilDailyReset()), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(CHARS_KEY, JSON.stringify(chars));
  }, [chars, ready]);
  useEffect(() => {
    if (ready) localStorage.setItem(DAILY_KEY, JSON.stringify(daily));
  }, [daily, ready]);
  useEffect(() => {
    if (ready) localStorage.setItem(WEEKLY_KEY, JSON.stringify(weekly));
  }, [weekly, ready]);
  useEffect(() => {
    if (ready) localStorage.setItem(RAIDDIFF_KEY, JSON.stringify(raidDiff));
  }, [raidDiff, ready]);

  async function addManual() {
    const name = input.trim();
    if (!name) return;
    setInput("");
    if (chars.some((c) => c.name === name)) return;
    setChars((prev) => [...prev, { name }]);
    const profiles = await fetchProfiles([name]);
    const p = profiles.get(name);
    if (p) setChars((prev) => prev.map((c) => (c.name === name ? { ...c, ...p } : c)));
  }

  async function importExpedition() {
    const q = input.trim();
    if (!q) return;
    setImporting(true);
    setError(null);
    try {
      const res = await fetch(`/api/siblings/${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "조회 실패");
      const list: Sibling[] = Array.isArray(data) ? data : [];
      const sorted = list
        .slice()
        .sort((a, b) => parseItemLevel(b.ItemMaxLevel) - parseItemLevel(a.ItemMaxLevel));
      const imported: CharInfo[] = sorted.map((c) => ({
        name: c.CharacterName,
        server: c.ServerName,
        className: c.CharacterClassName,
        itemLevel: c.ItemMaxLevel,
      }));

      setChars((prev) => {
        const map = new Map(prev.map((c) => [c.name, c]));
        for (const c of imported) map.set(c.name, { ...map.get(c.name), ...c });
        return Array.from(map.values());
      });
      setInput("");

      const profiles = await fetchProfiles(imported.map((c) => c.name));
      if (profiles.size > 0) {
        setChars((prev) =>
          prev.map((c) => {
            const p = profiles.get(c.name);
            return p ? { ...c, ...p } : c;
          }),
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setImporting(false);
    }
  }

  function removeChar(name: string) {
    setChars((prev) => prev.filter((c) => c.name !== name));
  }

  function toggle(
    state: PeriodState,
    setState: (s: PeriodState) => void,
    scope: string,
    taskId: string,
  ) {
    const scopeData = state.data[scope] ?? {};
    setState({
      period: state.period,
      data: { ...state.data, [scope]: { ...scopeData, [taskId]: !scopeData[taskId] } },
    });
  }

  const isDone = (state: PeriodState, scope: string, taskId: string) =>
    Boolean(state.data[scope]?.[taskId]);

  const diffOf = (charName: string, raid: Raid) =>
    raidDiff[charName]?.[raid.id] ?? defaultDifficulty(raid);

  function setDiff(charName: string, raidId: string, diffId: string) {
    setRaidDiff((prev) => ({
      ...prev,
      [charName]: { ...prev[charName], [raidId]: diffId },
    }));
  }

  // 캐릭터 주간 레이드 골드 (선택 난이도 기준, 체크된 관문 합산)
  function raidGold(charName: string) {
    let earned = 0;
    let total = 0;
    for (const raid of RAIDS) {
      const diff = getDifficulty(raid, diffOf(charName, raid));
      diff.gates.forEach((g, i) => {
        total += g.gold;
        if (isDone(weekly, charName, gateTaskId(raid.id, diff.id, i))) earned += g.gold;
      });
    }
    return { earned, total };
  }

  const totalGold = chars.reduce((sum, c) => sum + raidGold(c.name).earned, 0);

  if (!ready) return <div className="text-gray-400">불러오는 중...</div>;

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-bold">숙제 체크</h1>
        <span className="text-sm text-gray-400">
          일일 리셋까지 <span className="text-amber-300">{resetIn}</span>
        </span>
      </div>
      <p className="mb-4 text-sm text-gray-400">
        일일 숙제는 매일 06시, 주간 숙제는 수요일 06시에 자동 초기화됩니다.
      </p>

      {chars.length > 0 && (
        <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm">
          <span className="text-gray-300">이번 주 예상 골드 수익</span>
          <span className="font-mono font-bold text-amber-300">
            {totalGold.toLocaleString()} G
          </span>
        </div>
      )}

      <div className="mb-6 rounded-lg border border-white/10 bg-[#1a1d29] p-4">
        <div className="flex flex-wrap gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && importExpedition()}
            placeholder="캐릭터명 입력"
            className="min-w-[180px] flex-1 rounded-lg border border-white/10 bg-[#11141d] px-3 py-2 outline-none focus:border-amber-400"
          />
          <button
            onClick={importExpedition}
            disabled={importing}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-50"
          >
            {importing ? "불러오는 중..." : "원정대 불러오기"}
          </button>
          <button
            onClick={addManual}
            className="rounded-lg border border-white/15 px-4 py-2 text-sm hover:bg-white/5"
          >
            직접 추가
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
      </div>

      {chars.length === 0 ? (
        <div className="rounded-lg border border-dashed border-white/15 p-10 text-center text-gray-400">
          캐릭터를 추가해 숙제를 관리하세요.
        </div>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-2">
          {chars.map((c) => (
            <CharacterCard
              key={c.name}
              char={c}
              gold={raidGold(c.name)}
              diffOf={(raid) => diffOf(c.name, raid)}
              onSetDiff={(raidId, diffId) => setDiff(c.name, raidId, diffId)}
              isDailyDone={(id) => isDone(daily, c.name, id)}
              isWeeklyDone={(id) => isDone(weekly, c.name, id)}
              onToggleDaily={(id) => toggle(daily, setDaily, c.name, id)}
              onToggleWeekly={(id) => toggle(weekly, setWeekly, c.name, id)}
              onRemove={() => removeChar(c.name)}
            />
          ))}

          <div className="rounded-xl border border-white/10 bg-[#1a1d29] p-4 lg:col-span-2">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              원정대 주간 공통
            </div>
            <div className="flex flex-wrap gap-x-6">
              {ACCOUNT_WEEKLY_TASKS.map((t) => (
                <CheckRow
                  key={t.id}
                  label={t.label}
                  checked={isDone(weekly, ACCOUNT_SCOPE, t.id)}
                  onToggle={() => toggle(weekly, setWeekly, ACCOUNT_SCOPE, t.id)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const DIFF_COLOR: Record<string, string> = {
  single: "text-gray-300",
  normal: "text-sky-400",
  hard: "text-red-400",
  nightmare: "text-purple-400",
  stage1: "text-amber-300",
  stage2: "text-amber-300",
};

function CharacterCard({
  char,
  gold,
  diffOf,
  onSetDiff,
  isDailyDone,
  isWeeklyDone,
  onToggleDaily,
  onToggleWeekly,
  onRemove,
}: {
  char: CharInfo;
  gold: { earned: number; total: number };
  diffOf: (raid: Raid) => string;
  onSetDiff: (raidId: string, diffId: string) => void;
  isDailyDone: (id: string) => boolean;
  isWeeklyDone: (id: string) => boolean;
  onToggleDaily: (id: string) => void;
  onToggleWeekly: (id: string) => void;
  onRemove: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#1a1d29]">
      {/* 헤더: 캐릭터 이미지 배경 */}
      <div className="relative h-28 overflow-hidden">
        {char.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={char.image}
            alt={char.name}
            className="absolute inset-0 h-full w-full object-cover object-[center_25%]"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#2a2f45] to-[#1a1d29]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/25" />
        <div className="relative flex h-full flex-col justify-center p-4">
          <div className="text-xs text-gray-300">
            {char.server ? `@${char.server} ` : ""}
            {char.className}
          </div>
          <div className="text-lg font-bold text-white drop-shadow">{char.name}</div>
          {char.itemLevel && (
            <div className="font-mono text-sm text-amber-300">Lv. {char.itemLevel}</div>
          )}
          {char.combatPower && (
            <div className="mt-0.5 inline-block w-fit rounded bg-orange-500/80 px-1.5 py-0.5 text-[11px] font-semibold text-white">
              전투력 {char.combatPower}
            </div>
          )}
        </div>
        <div className="absolute right-3 top-3 text-right">
          <div className="font-mono text-sm font-bold text-amber-300 drop-shadow">
            {gold.earned.toLocaleString()}
            <span className="text-gray-300"> / {gold.total.toLocaleString()} G</span>
          </div>
          <button
            onClick={onRemove}
            className="text-xs text-gray-300 hover:text-red-400"
          >
            삭제
          </button>
        </div>
      </div>

      <div className="space-y-3 p-3">
        {/* 일일 */}
        <div>
          <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
            일일 숙제
          </div>
          <div className="flex flex-wrap gap-x-5">
            {DAILY_TASKS.map((t) => (
              <CheckRow
                key={t.id}
                label={t.label}
                checked={isDailyDone(t.id)}
                onToggle={() => onToggleDaily(t.id)}
              />
            ))}
          </div>
        </div>

        {/* 주간 레이드 */}
        <div>
          <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
            주간 레이드
          </div>
          <div className="space-y-2">
            {RAIDS.map((raid) => {
              const diffId = diffOf(raid);
              const diff = getDifficulty(raid, diffId);
              const earned = diff.gates.reduce(
                (s, g, i) =>
                  s + (isWeeklyDone(gateTaskId(raid.id, diff.id, i)) ? g.gold : 0),
                0,
              );
              const total = diff.gates.reduce((s, g) => s + g.gold, 0);
              const allDone = diff.gates.every((_g, i) =>
                isWeeklyDone(gateTaskId(raid.id, diff.id, i)),
              );
              return (
                <div
                  key={raid.id}
                  className={`rounded-lg border p-2.5 transition ${
                    allDone
                      ? "border-white/5 bg-black/30 opacity-50"
                      : "border-white/10 bg-[#11141d]"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-sm font-medium">{raid.name}</span>
                      {raid.difficulties.length > 1 && (
                        <div className="flex shrink-0 gap-1">
                          {raid.difficulties.map((d) => (
                            <button
                              key={d.id}
                              onClick={() => onSetDiff(raid.id, d.id)}
                              className={`rounded px-1.5 py-0.5 text-[11px] transition ${
                                d.id === diffId
                                  ? `bg-white/10 font-semibold ${DIFF_COLOR[d.id] ?? "text-white"}`
                                  : "text-gray-500 hover:text-gray-300"
                              }`}
                            >
                              {d.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="shrink-0 font-mono text-xs text-amber-300">
                      {earned.toLocaleString()} / {total.toLocaleString()} G
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {diff.gates.map((g, i) => {
                      const done = isWeeklyDone(gateTaskId(raid.id, diff.id, i));
                      return (
                        <button
                          key={i}
                          onClick={() => onToggleWeekly(gateTaskId(raid.id, diff.id, i))}
                          className={`flex-1 rounded-md px-2 py-1.5 text-center text-xs transition ${
                            done
                              ? "bg-amber-500 font-semibold text-black"
                              : "bg-white/5 text-gray-300 hover:bg-white/10"
                          }`}
                        >
                          <div>{g.label}</div>
                          <div className={done ? "text-black/70" : "text-gray-500"}>
                            {g.gold.toLocaleString()}G
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 기타 주간 */}
        <div className="flex flex-wrap gap-x-5 border-t border-white/5 pt-2">
          {WEEKLY_TASKS.map((t) => (
            <CheckRow
              key={t.id}
              label={t.label}
              checked={isWeeklyDone(t.id)}
              onToggle={() => onToggleWeekly(t.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function CheckRow({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 py-1">
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="h-4 w-4 accent-amber-500"
      />
      <span
        className={`text-sm ${checked ? "text-gray-500 line-through" : "text-gray-200"}`}
      >
        {label}
      </span>
    </label>
  );
}
