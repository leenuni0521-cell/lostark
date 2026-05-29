import Link from "next/link";
import { getArmory, LostArkApiError } from "@/lib/lostark";

export default async function CharacterPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const decoded = decodeURIComponent(name);

  let armory;
  let errorMsg: string | null = null;
  try {
    armory = await getArmory(decoded);
  } catch (err) {
    errorMsg =
      err instanceof LostArkApiError
        ? err.message
        : "데이터를 불러오지 못했습니다.";
  }

  const profile = armory?.ArmoryProfile;

  if (errorMsg || !profile) {
    return (
      <div>
        <Link href="/" className="text-sm text-amber-400 hover:underline">
          ← 돌아가기
        </Link>
        <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {errorMsg || "존재하지 않는 캐릭터입니다."}
        </div>
      </div>
    );
  }

  const mainStats = (profile.Stats ?? []).filter((s) =>
    ["치명", "특화", "신속", "제압", "인내", "숙련"].includes(s.Type),
  );

  return (
    <div>
      <Link href="/" className="text-sm text-amber-400 hover:underline">
        ← 돌아가기
      </Link>

      <div className="mt-4 flex flex-col gap-6 rounded-xl border border-white/10 bg-[#1a1d29] p-6 sm:flex-row">
        {profile.CharacterImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.CharacterImage}
            alt={profile.CharacterName}
            className="h-64 w-48 shrink-0 self-center rounded-lg object-cover sm:self-start"
          />
        )}
        <div className="flex-1">
          <div className="text-sm text-gray-400">
            {profile.ServerName} · {profile.CharacterClassName}
          </div>
          <h1 className="text-2xl font-bold">{profile.CharacterName}</h1>
          {profile.Title && (
            <div className="mt-1 text-sm text-amber-300">{profile.Title}</div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <Info
              label="아이템 레벨"
              value={profile.ItemMaxLevel || profile.ItemAvgLevel || "-"}
              highlight
            />
            <Info label="전투 레벨" value={`Lv.${profile.CharacterLevel}`} />
            <Info label="원정대 레벨" value={`Lv.${profile.ExpeditionLevel}`} />
            {profile.GuildName && <Info label="길드" value={profile.GuildName} />}
            {profile.TownName && (
              <Info label="영지" value={`${profile.TownName} Lv.${profile.TownLevel ?? "-"}`} />
            )}
            <Info label="PVP" value={profile.PvpGradeName || "-"} />
          </div>

          {mainStats.length > 0 && (
            <div className="mt-4">
              <div className="mb-2 text-xs text-gray-500">특성</div>
              <div className="flex flex-wrap gap-2">
                {mainStats.map((s) => (
                  <span
                    key={s.Type}
                    className="rounded-md bg-white/5 px-3 py-1.5 text-sm"
                  >
                    <span className="text-gray-400">{s.Type}</span>{" "}
                    <span className="font-mono font-semibold text-amber-300">
                      {s.Value}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {armory?.ArmoryEquipment && armory.ArmoryEquipment.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 text-lg font-semibold">장비</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {armory.ArmoryEquipment.map((item, i) => (
              <div
                key={`${item.Type}-${i}`}
                className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#1a1d29] p-2.5"
              >
                {item.Icon && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.Icon}
                    alt={item.Name}
                    className="h-10 w-10 rounded"
                  />
                )}
                <div className="min-w-0">
                  <div className="text-xs text-gray-500">{item.Type}</div>
                  <div
                    className={`truncate text-sm font-medium grade-${item.Grade}`}
                    title={item.Name}
                  >
                    {item.Name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Info({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg bg-white/5 px-3 py-2">
      <div className="text-xs text-gray-500">{label}</div>
      <div
        className={`font-semibold ${highlight ? "text-amber-300" : "text-gray-100"}`}
      >
        {value}
      </div>
    </div>
  );
}
