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

// "기록 없는 멤버 숨기기" 설정 (기기별, 기본 꺼짐 = 모두 표시)
const HIDE_INACTIVE_KEY = "gram-hide-inactive";

export default function ComparePage() {
  const [period, setPeriod] = useState<Period>("week");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [byMember, setByMember] = useState<Record<string, WeightMap>>({});
  const [myId, setMyId] = useState<string | null>(null);
  // 탭한 날짜 인덱스 (툴팁 표시용)
  const [sel, setSel] = useState<number | null>(null);
  const [hideInactive, setHideInactive] = useState(false);

  function toggleHideInactive() {
    setHideInactive((v) => {
      localStorage.setItem(HIDE_INACTIVE_KEY, v ? "off" : "on");
      return !v;
    });
  }

  useEffect(() => {
    setHideInactive(localStorage.getItem(HIDE_INACTIVE_KEY) === "on");
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
  // 숨기기 설정이 켜져 있으면 최근 30일 기록이 없는 멤버
  // (공유를 끈 멤버 포함)는 숨긴다. 나는 항상 표시. 내 카드가 항상 맨 위.
  const ordered = [...profiles]
    .filter(
      (p) =>
        !hideInactive ||
        p.id === myId ||
        Object.keys(byMember[p.id] ?? {}).length > 0,
    )
    .sort((a, b) => Number(b.id === myId) - Number(a.id === myId));
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

  // 툴팁에 넣을 선택 날짜의 멤버별 값
  const selRows =
    sel == null
      ? []
      : seriesByMember
          .map(({ profile, series }) => ({
            profile,
            weight: series[sel]?.weight ?? null,
          }))
          .filter(
            (r): r is { profile: Profile; weight: number } => r.weight != null,
          );
  const selDate = sel == null ? null : fromISO(axisDays[sel].iso);

  return (
    <div>
      {/* 헤더 + 기간 토글 */}
      <div className="bg-white px-6 pt-1.5 pb-[18px]">
        <div className="text-[22px] font-extrabold tracking-[-0.5px]">
          친구 비교
        </div>
        <div className="mt-1 text-sm font-medium text-sub">
          최근 {days}일 · {ordered.length}명
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
              onClick={() => {
                setPeriod(key);
                setSel(null);
              }}
              className={`rounded-full px-4 py-2 text-[13px] font-semibold ${
                period === key ? "bg-ink text-white" : "bg-line text-sub"
              }`}
            >
              {label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[13px] font-semibold text-sub">
              기록 없는 멤버 숨김
            </span>
            <button
              onClick={toggleHideInactive}
              className={`relative h-[26px] w-11 rounded-full transition-colors ${
                hideInactive ? "bg-main" : "bg-line-strong"
              }`}
            >
              <span
                className={`absolute top-[3px] h-5 w-5 rounded-full bg-white transition-all ${
                  hideInactive ? "right-[3px]" : "left-[3px]"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 라인차트 */}
      <div className="relative bg-white px-4 pb-5">
        <svg viewBox="0 0 330 210" className="h-auto w-full">
          {sel != null && (
            <line
              x1={x(sel)}
              y1={Y0 - 4}
              x2={x(sel)}
              y2={Y1 + 2}
              stroke="#D0D5DB"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
          )}
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
              // 마지막 날 기준 7일 간격 → 마지막 라벨과 겹치지 않는다
              if ((days - 1 - i) % 7 !== 0) return null;
              return (
                <text key={p.iso} x={x(i)} y="200">
                  {d.getMonth() + 1}/{d.getDate()}
                </text>
              );
            })}
          </g>

          {/* 선택 날짜의 값 강조 */}
          {sel != null &&
            selRows.map(({ profile, weight }) => (
              <circle
                key={profile.id}
                cx={x(sel)}
                cy={y(weight)}
                r="4.5"
                fill={profile.color}
                stroke="#fff"
                strokeWidth="1.5"
              />
            ))}

          {/* 날짜별 탭 영역 */}
          {axisDays.map((p, i) => {
            const colW = (X1 - X0) / (days - 1);
            return (
              <rect
                key={p.iso}
                x={x(i) - colW / 2}
                y="0"
                width={colW}
                height="195"
                fill="transparent"
                onClick={() => setSel(sel === i ? null : i)}
              />
            );
          })}
        </svg>

        {/* 툴팁 */}
        {sel != null && selDate != null && (
          <div
            className="pointer-events-none absolute top-2 z-10 -translate-x-1/2 rounded-xl border border-line bg-white px-3.5 py-2.5 shadow-[0_6px_20px_rgba(25,31,40,0.12)]"
            style={{
              left: `${Math.min(78, Math.max(22, (x(sel) / 330) * 100))}%`,
            }}
          >
            <div className="text-[11px] font-semibold whitespace-nowrap text-faint">
              {selDate.getMonth() + 1}월 {selDate.getDate()}일 (
              {WEEKDAYS[selDate.getDay()]})
            </div>
            {selRows.length === 0 ? (
              <div className="mt-1 text-xs font-medium whitespace-nowrap text-sub">
                기록 없음
              </div>
            ) : (
              selRows.map(({ profile, weight }) => (
                <div
                  key={profile.id}
                  className="mt-1 flex items-center gap-1.5 whitespace-nowrap"
                >
                  <span
                    className="h-2 w-2 rounded-[3px]"
                    style={{ background: profile.color }}
                  />
                  <span className="text-xs font-semibold">{profile.name}</span>
                  <span className="text-xs font-extrabold">
                    {weight.toFixed(1)}kg
                  </span>
                </div>
              ))
            )}
          </div>
        )}
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
