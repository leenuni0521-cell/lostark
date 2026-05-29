"use client";

import { useMemo, useState } from "react";

export default function CalculatorPage() {
  const [tab, setTab] = useState<"honing" | "gold">("honing");

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">계산기</h1>

      <div className="mb-6 flex gap-2">
        <TabBtn active={tab === "honing"} onClick={() => setTab("honing")}>
          재련 기댓값
        </TabBtn>
        <TabBtn active={tab === "gold"} onClick={() => setTab("gold")}>
          골드/현금 환산
        </TabBtn>
      </div>

      {tab === "honing" ? <HoningCalc /> : <GoldCalc />}
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
        active
          ? "bg-amber-500 text-black"
          : "border border-white/15 text-gray-300 hover:bg-white/5"
      }`}
    >
      {children}
    </button>
  );
}

// ---- 재련 기댓값 계산기 ----
function HoningCalc() {
  const [baseRate, setBaseRate] = useState("10"); // 기본 성공 확률 %
  const [artisanGain, setArtisanGain] = useState("4.65"); // 실패 시 장인의 기운 누적 %

  const result = useMemo(() => {
    const p = parseFloat(baseRate) / 100;
    const g = parseFloat(artisanGain) / 100;
    if (!(p > 0) || p > 1 || !(g >= 0)) return null;

    // 장인의 기운이 100% 누적되면 다음 시도는 무조건 성공.
    // 실패 k회 누적 시 기운 = k*g. k >= 1/g 이면 강제 성공.
    const maxFails = g > 0 ? Math.ceil(1 / g) : Infinity;

    // 시도 횟수의 기댓값 계산 (장인의 기운에 의한 천장 포함)
    // E[시도] = Σ_{n} P(n번째에 성공) * n
    let expected = 0;
    let survive = 1; // n-1회까지 모두 실패할 확률
    const cap = Number.isFinite(maxFails) ? maxFails + 1 : 1000;
    for (let n = 1; n <= cap; n++) {
      const forced = n > maxFails; // 천장 도달 후 강제 성공
      const succ = forced ? 1 : p;
      expected += survive * succ * n;
      survive *= 1 - succ;
      if (survive <= 1e-9) break;
    }

    return {
      expected,
      maxFails: Number.isFinite(maxFails) ? maxFails : null,
      guaranteedAt: Number.isFinite(maxFails) ? maxFails + 1 : null,
    };
  }, [baseRate, artisanGain]);

  return (
    <div className="max-w-md rounded-xl border border-white/10 bg-[#1a1d29] p-5">
      <Field
        label="기본 성공 확률 (%)"
        value={baseRate}
        onChange={setBaseRate}
        placeholder="예: 10"
      />
      <Field
        label="실패 시 장인의 기운 누적 (%)"
        value={artisanGain}
        onChange={setArtisanGain}
        placeholder="예: 4.65"
        hint="보통 기본 확률의 약 절반(=2.15배율). 인게임 표기값을 그대로 넣어도 됩니다."
      />

      {result ? (
        <div className="mt-4 space-y-2 border-t border-white/10 pt-4 text-sm">
          <Row
            label="평균 시도 횟수"
            value={`${result.expected.toFixed(1)} 회`}
            highlight
          />
          {result.guaranteedAt && (
            <Row label="확정 성공 (천장)" value={`${result.guaranteedAt}회차`} />
          )}
        </div>
      ) : (
        <p className="mt-4 text-sm text-gray-500">올바른 값을 입력하세요.</p>
      )}
      <p className="mt-3 text-xs text-gray-500">
        ※ 장인의 기운(천장) 시스템을 반영한 근사치입니다. 추가 확률(풀무·책 등)은
        기본 확률에 더해 입력하세요.
      </p>
    </div>
  );
}

// ---- 골드/현금 환산 ----
function GoldCalc() {
  const [crystalPrice, setCrystalPrice] = useState("90"); // 95크리스탈당 골드
  const [goldAmount, setGoldAmount] = useState("10000"); // 보유 골드
  const [cashPer, setCashPer] = useState("995"); // 100크리스탈당 원

  const result = useMemo(() => {
    const gold = parseFloat(goldAmount);
    const cPrice = parseFloat(crystalPrice); // 95크리스탈 = cPrice 골드
    const cashWon = parseFloat(cashPer); // 100크리스탈 = cashWon 원
    if (!(gold >= 0) || !(cPrice > 0) || !(cashWon > 0)) return null;

    // 골드 -> 크리스탈 -> 원
    const crystals = (gold / cPrice) * 95;
    const won = (crystals / 100) * cashWon;
    return { crystals, won };
  }, [goldAmount, crystalPrice, cashPer]);

  return (
    <div className="max-w-md rounded-xl border border-white/10 bg-[#1a1d29] p-5">
      <Field label="보유 골드" value={goldAmount} onChange={setGoldAmount} />
      <Field
        label="크리스탈 시세 (95 크리스탈당 골드)"
        value={crystalPrice}
        onChange={setCrystalPrice}
        hint="거래소 '크리스탈' 시세를 입력하세요."
      />
      <Field
        label="크리스탈 현금가 (100 크리스탈당 원)"
        value={cashPer}
        onChange={setCashPer}
      />

      {result ? (
        <div className="mt-4 space-y-2 border-t border-white/10 pt-4 text-sm">
          <Row
            label="≈ 크리스탈"
            value={`${Math.round(result.crystals).toLocaleString()} 개`}
          />
          <Row
            label="≈ 현금 가치"
            value={`${Math.round(result.won).toLocaleString()} 원`}
            highlight
          />
        </div>
      ) : (
        <p className="mt-4 text-sm text-gray-500">올바른 값을 입력하세요.</p>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <label className="mb-3 block">
      <span className="mb-1 block text-sm text-gray-300">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-white/10 bg-[#11141d] px-3 py-2 outline-none focus:border-amber-400"
      />
      {hint && <span className="mt-1 block text-xs text-gray-500">{hint}</span>}
    </label>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-400">{label}</span>
      <span
        className={`font-mono font-semibold ${highlight ? "text-amber-300" : "text-gray-100"}`}
      >
        {value}
      </span>
    </div>
  );
}
