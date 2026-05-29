"use client";

import { useEffect, useState } from "react";
import type { Sibling } from "@/lib/lostark";
import {
  DAILY_TASKS,
  WEEKLY_TASKS,
  ACCOUNT_WEEKLY_TASKS,
} from "@/lib/tasks";
import {
  dailyPeriodKey,
  weeklyPeriodKey,
  timeUntilDailyReset,
} from "@/lib/reset";

interface CharInfo {
  name: string;
  server?: string;
  className?: string;
  itemLevel?: string;
}

// taskId -> boolean
type TaskMap = Record<string, boolean>;
// charName -> TaskMap
type ScopeMap = Record<string, TaskMap>;

interface PeriodState {
  period: string;
  data: ScopeMap;
}

const CHARS_KEY = "loa.chars";
const DAILY_KEY = "loa.daily";
const WEEKLY_KEY = "loa.weekly";
const ACCOUNT_SCOPE = "__account__";

function loadPeriod(key: string, currentPeriod: string): PeriodState {
  if (typeof window === "undefined") return { period: currentPeriod, data: {} };
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as PeriodState;
      // 기간이 바뀌었으면 초기화 (자동 리셋)
      if (parsed.period === currentPeriod) return parsed;
    }
  } catch {
    /* ignore */
  }
  return { period: currentPeriod, data: {} };
}

export default function HomeworkPage() {
  const [chars, setChars] = useState<CharInfo[]>([]);
  const [daily, setDaily] = useState<PeriodState>({ period: "", data: {} });
  const [weekly, setWeekly] = useState<PeriodState>({ period: "", data: {} });
  const [input, setInput] = useState("");
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetIn, setResetIn] = useState("");
  const [ready, setReady] = useState(false);

  // 초기 로드
  useEffect(() => {
    const dp = dailyPeriodKey();
    const wp = weeklyPeriodKey();
    try {
      const rawChars = localStorage.getItem(CHARS_KEY);
      if (rawChars) setChars(JSON.parse(rawChars));
    } catch {
      /* ignore */
    }
    setDaily(loadPeriod(DAILY_KEY, dp));
    setWeekly(loadPeriod(WEEKLY_KEY, wp));
    setResetIn(timeUntilDailyReset());
    setReady(true);
    const t = setInterval(() => setResetIn(timeUntilDailyReset()), 60000);
    return () => clearInterval(t);
  }, []);

  // 저장
  useEffect(() => {
    if (ready) localStorage.setItem(CHARS_KEY, JSON.stringify(chars));
  }, [chars, ready]);
  useEffect(() => {
    if (ready) localStorage.setItem(DAILY_KEY, JSON.stringify(daily));
  }, [daily, ready]);
  useEffect(() => {
    if (ready) localStorage.setItem(WEEKLY_KEY, JSON.stringify(weekly));
  }, [weekly, ready]);

  function addManual() {
    const name = input.trim();
    if (!name) return;
    if (!chars.some((c) => c.name === name)) {
      setChars((prev) => [...prev, { name }]);
    }
    setInput("");
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
      const sorted = (data as Sibling[]).slice().sort(
        (a, b) =>
          parseFloat(b.ItemMaxLevel.replace(/,/g, "")) -
          parseFloat(a.ItemMaxLevel.replace(/,/g, "")),
      );
      const imported: CharInfo[] = sorted.map((c) => ({
        name: c.CharacterName,
        server: c.ServerName,
        className: c.CharacterClassName,
        itemLevel: c.ItemMaxLevel,
      }));
      // 기존 + 신규 병합 (중복 제거)
      setChars((prev) => {
        const map = new Map(prev.map((c) => [c.name, c]));
        for (const c of imported) map.set(c.name, c);
        return Array.from(map.values());
      });
      setInput("");
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
    const next: PeriodState = {
      period: state.period,
      data: {
        ...state.data,
        [scope]: { ...scopeData, [taskId]: !scopeData[taskId] },
      },
    };
    setState(next);
  }

  const isDone = (state: PeriodState, scope: string, taskId: string) =>
    Boolean(state.data[scope]?.[taskId]);

  // 진행도 계산
  function charProgress(name: string) {
    const total = DAILY_TASKS.length + WEEKLY_TASKS.length;
    let done = 0;
    for (const t of DAILY_TASKS) if (isDone(daily, name, t.id)) done++;
    for (const t of WEEKLY_TASKS) if (isDone(weekly, name, t.id)) done++;
    return { done, total };
  }

  if (!ready) {
    return <div className="text-gray-400">불러오는 중...</div>;
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-bold">숙제 체크</h1>
        <span className="text-sm text-gray-400">
          일일 리셋까지 <span className="text-amber-300">{resetIn}</span>
        </span>
      </div>
      <p className="mb-6 text-sm text-gray-400">
        일일 숙제는 매일 06시, 주간 숙제는 수요일 06시에 자동 초기화됩니다.
      </p>

      {/* 캐릭터 추가 */}
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
        <div className="space-y-4">
          {chars.map((c) => {
            const p = charProgress(c.name);
            return (
              <div
                key={c.name}
                className="rounded-xl border border-white/10 bg-[#1a1d29] p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <span className="font-semibold">{c.name}</span>
                    {c.itemLevel && (
                      <span className="ml-2 font-mono text-sm text-amber-300">
                        {c.itemLevel}
                      </span>
                    )}
                    {c.className && (
                      <span className="ml-2 text-xs text-gray-500">
                        {c.className}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-sm ${p.done === p.total ? "text-green-400" : "text-gray-400"}`}
                    >
                      {p.done}/{p.total}
                    </span>
                    <button
                      onClick={() => removeChar(c.name)}
                      className="text-xs text-gray-500 hover:text-red-400"
                    >
                      삭제
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <TaskGroup
                    title="일일"
                    tasks={DAILY_TASKS}
                    done={(id) => isDone(daily, c.name, id)}
                    onToggle={(id) => toggle(daily, setDaily, c.name, id)}
                  />
                  <TaskGroup
                    title="주간"
                    tasks={WEEKLY_TASKS}
                    done={(id) => isDone(weekly, c.name, id)}
                    onToggle={(id) => toggle(weekly, setWeekly, c.name, id)}
                  />
                </div>
              </div>
            );
          })}

          {/* 원정대 단위 주간 숙제 */}
          <div className="rounded-xl border border-white/10 bg-[#1a1d29] p-4">
            <TaskGroup
              title="원정대 주간 공통"
              tasks={ACCOUNT_WEEKLY_TASKS}
              done={(id) => isDone(weekly, ACCOUNT_SCOPE, id)}
              onToggle={(id) => toggle(weekly, setWeekly, ACCOUNT_SCOPE, id)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function TaskGroup({
  title,
  tasks,
  done,
  onToggle,
}: {
  title: string;
  tasks: { id: string; label: string }[];
  done: (id: string) => boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <div>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        {title}
      </div>
      <div className="space-y-1.5">
        {tasks.map((t) => {
          const checked = done(t.id);
          return (
            <label
              key={t.id}
              className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-white/5"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(t.id)}
                className="h-4 w-4 accent-amber-500"
              />
              <span
                className={`text-sm ${checked ? "text-gray-500 line-through" : "text-gray-200"}`}
              >
                {t.label}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
