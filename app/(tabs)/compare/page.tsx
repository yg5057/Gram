"use client";

import { useEffect, useState } from "react";
import { addDaysISO, fromISO, todayISO, WEEKDAYS } from "@/lib/date";
import {
  deltaFor,
  fmtDelta,
  latestEntry,
  seriesFor,
  type WeightMap,
} from "@/lib/weights";
import {
  getAllWeights,
  getProfiles,
  getSessionUser,
  type Profile,
} from "@/lib/data";

type Period = "week" | "month";

// 차트 플롯 영역 (viewBox 330 x 210)
const X0 = 20;
const X1 = 310;
const Y0 = 12;
const Y1 = 178;

export default function ComparePage() {
  const [period, setPeriod] = useState<Period>("week");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [byMember, setByMember] = useState<Record<string, WeightMap>>({});
  const [myId, setMyId] = useState<string | null>(null);

  useEffect(() => {
    const since = addDaysISO(todayISO(), -29);
    Promise.all([getProfiles(), getAllWeights(since), getSessionUser()]).then(
      ([p, w, user]) => {
        setProfiles(p);
        setByMember(w);
        setMyId(user?.id ?? null);
      },
    );
  }, []);

  const days = period === "week" ? 7 : 30;
  // 내 카드가 항상 맨 위
  const ordered = [...profiles].sort(
    (a, b) => Number(b.id === myId) - Number(a.id === myId),
  );
  const seriesByMember = ordered.map((p) => ({
    profile: p,
    isMe: p.id === myId,
    weights: byMember[p.id] ?? {},
    series: seriesFor(byMember[p.id] ?? {}, days),
  }));

  const values = seriesByMember
    .flatMap(({ series }) => series.map((p) => p.weight))
    .filter((v): v is number => v != null);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 1;
  const pad = (max - min) * 0.08 + 0.3;
  const lo = min - pad;
  const hi = max + pad;

  const x = (idx: number) => X0 + (idx / (days - 1)) * (X1 - X0);
  const y = (v: number) => Y0 + ((hi - v) / (hi - lo)) * (Y1 - Y0);

  const axisDays = seriesFor({}, days);

  return (
    <div>
      {/* 헤더 + 기간 토글 */}
      <div className="bg-white px-6 pt-1.5 pb-[18px]">
        <div className="text-[22px] font-extrabold tracking-[-0.5px]">
          친구 비교
        </div>
        <div className="mt-1 text-sm font-medium text-sub">
          최근 {days}일 · {profiles.length}명
        </div>
        <div className="mt-4 flex gap-2">
          {(
            [
              ["week", "주간"],
              ["month", "월간"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={`rounded-full px-4 py-2 text-[13px] font-semibold ${
                period === key ? "bg-ink text-white" : "bg-line text-sub"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 라인차트 */}
      <div className="bg-white px-4 pb-5">
        <svg viewBox="0 0 330 210" className="h-auto w-full">
          <line x1={X0} y1={Y0 - 2} x2={X0} y2={Y1 + 2} stroke="#F1F3F5" />
          <line x1={X0} y1={Y1 + 2} x2={X1 + 10} y2={Y1 + 2} stroke="#F1F3F5" />
          <line
            x1={X0}
            y1={(Y0 + Y1) / 2}
            x2={X1 + 10}
            y2={(Y0 + Y1) / 2}
            stroke="#F7F8FA"
            strokeDasharray="3 3"
          />
          {seriesByMember.map(({ profile, isMe, series }) => {
            const pts = series
              .map((p, i) => (p.weight == null ? null : { i, w: p.weight }))
              .filter((p): p is { i: number; w: number } => p != null);
            if (pts.length === 0) return null;
            const last = pts[pts.length - 1];
            return (
              <g key={profile.id}>
                <polyline
                  points={pts.map((p) => `${x(p.i)},${y(p.w)}`).join(" ")}
                  fill="none"
                  stroke={profile.color}
                  strokeWidth={isMe ? 3.5 : 3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  cx={x(last.i)}
                  cy={y(last.w)}
                  r={isMe ? 5 : 4}
                  fill={profile.color}
                  stroke={isMe ? "#fff" : "none"}
                  strokeWidth={isMe ? 2 : 0}
                />
              </g>
            );
          })}
          <g
            fontFamily="inherit"
            fontSize="10"
            fill="#B0B8C1"
            textAnchor="middle"
          >
            {axisDays.map((p, i) => {
              const d = fromISO(p.iso);
              if (period === "week") {
                return (
                  <text key={p.iso} x={x(i)} y="200">
                    {WEEKDAYS[d.getDay()]}
                  </text>
                );
              }
              if (i % 7 !== 0 && i !== days - 1) return null;
              return (
                <text key={p.iso} x={x(i)} y="200">
                  {d.getMonth() + 1}/{d.getDate()}
                </text>
              );
            })}
          </g>
        </svg>
      </div>

      {/* 구성원 리스트 */}
      <div className="px-5 pt-1">
        {seriesByMember.map(({ profile, isMe, weights }) => {
          const latest = latestEntry(weights);
          const delta = latest ? deltaFor(weights, latest.iso) : null;
          return (
            <div
              key={profile.id}
              className={`mb-2.5 flex items-center gap-3.5 rounded-[18px] px-4 py-3.5 ${
                isMe ? "bg-main-light" : "border border-line bg-white"
              }`}
            >
              <div
                className="h-3 w-3 rounded"
                style={{ background: profile.color }}
              />
              <div className="flex-1 text-base font-bold">
                {profile.name}
                {isMe && (
                  <span className="ml-1.5 rounded-md bg-white px-2 py-0.5 text-xs font-semibold text-main-dark">
                    나
                  </span>
                )}
              </div>
              <div className="text-right">
                <div className="text-lg font-extrabold">
                  {latest ? `${latest.weight.toFixed(1)}kg` : "—"}
                </div>
                {delta != null && (
                  <div
                    className="text-xs font-semibold"
                    style={{
                      color: delta === 0 ? "#8B95A1" : profile.color,
                    }}
                  >
                    {fmtDelta(delta)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
