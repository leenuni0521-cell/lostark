"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import type { Sibling } from "@/lib/lostark";

export default function HomePage() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState<string | null>(null);
  const [siblings, setSiblings] = useState<Sibling[] | null>(null);

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    const q = name.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    setSiblings(null);
    try {
      const res = await fetch(`/api/siblings/${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "조회 실패");
      // 아이템 레벨 내림차순 정렬
      const sorted = (data as Sibling[]).slice().sort(
        (a, b) =>
          parseFloat(b.ItemMaxLevel.replace(/,/g, "")) -
          parseFloat(a.ItemMaxLevel.replace(/,/g, "")),
      );
      setSiblings(sorted);
      setSearched(q);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">캐릭터 조회</h1>
      <p className="mb-6 text-sm text-gray-400">
        캐릭터명을 입력하면 같은 원정대(계정)의 보유 캐릭터를 한 번에 불러옵니다.
      </p>

      <form onSubmit={handleSearch} className="mb-8 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="캐릭터명 입력"
          className="flex-1 rounded-lg border border-white/10 bg-[#1a1d29] px-4 py-2.5 outline-none focus:border-amber-400"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-amber-500 px-6 py-2.5 font-semibold text-black transition hover:bg-amber-400 disabled:opacity-50"
        >
          {loading ? "조회중..." : "조회"}
        </button>
      </form>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {siblings && (
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-lg font-semibold">
              원정대 캐릭터{" "}
              <span className="text-sm font-normal text-gray-400">
                ({siblings.length}개)
              </span>
            </h2>
            {searched && (
              <Link
                href={`/character/${encodeURIComponent(searched)}`}
                className="text-sm text-amber-400 hover:underline"
              >
                &quot;{searched}&quot; 상세보기 →
              </Link>
            )}
          </div>
          <div className="overflow-hidden rounded-lg border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-left text-gray-400">
                <tr>
                  <th className="px-4 py-2.5">서버</th>
                  <th className="px-4 py-2.5">캐릭터</th>
                  <th className="px-4 py-2.5">직업</th>
                  <th className="px-4 py-2.5 text-right">아이템 레벨</th>
                </tr>
              </thead>
              <tbody>
                {siblings.map((c) => (
                  <tr
                    key={c.CharacterName}
                    className="border-t border-white/5 hover:bg-white/5"
                  >
                    <td className="px-4 py-2.5 text-gray-400">{c.ServerName}</td>
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/character/${encodeURIComponent(c.CharacterName)}`}
                        className="font-medium text-amber-400 hover:underline"
                      >
                        {c.CharacterName}
                      </Link>
                      <span className="ml-2 text-xs text-gray-500">
                        Lv.{c.CharacterLevel}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-300">
                      {c.CharacterClassName}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-amber-300">
                      {c.ItemMaxLevel}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
