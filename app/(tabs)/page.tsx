"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { daysInMonth, firstWeekday, todayISO } from "@/lib/date";
import { deltaFor, type WeightMap } from "@/lib/weights";
import { getMyWeights } from "@/lib/data";

export default function CalendarHome() {
  const today = todayISO();
  const [ty, tm] = today.split("-").map(Number);
  const [year, setYear] = useState(ty);
  const [month, setMonth] = useState(tm);
  const [weights, setWeights] = useState<WeightMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyWeights()
      .then(setWeights)
      .finally(() => setLoading(false));
  }, []);

  function moveMonth(diff: number) {
    const d = new Date(year, month - 1 + diff, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
  }

  const todayWeight = weights[today];
  const delta = deltaFor(weights, today);

  const total = daysInMonth(year, month);
  const offset = firstWeekday(year, month);
  const cells: (number | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: total }, (_, i) => i + 1),
  ];

  return (
    <div>
      {/* 상단: 월 헤더 + 오늘 요약 */}
      <div className="bg-white px-6 pt-5 pb-[26px]">
        <div className="flex items-center justify-between">
          <div className="text-[22px] font-extrabold tracking-[-0.5px]">
            {month}월
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-sub">
            <button onClick={() => moveMonth(-1)} className="px-2 py-1">
              ＜
            </button>
            <span>{year}</span>
            <button onClick={() => moveMonth(1)} className="px-2 py-1">
              ＞
            </button>
          </div>
        </div>

        <div className="mt-[18px] rounded-[20px] bg-main-light px-6 py-[22px]">
          <div className="text-[13px] font-semibold text-main-dark">
            오늘 몸무게
          </div>
          {todayWeight != null ? (
            <>
              <div className="mt-1.5 flex items-baseline gap-2.5">
                <div className="text-[44px] leading-none font-extrabold tracking-[-1.5px]">
                  {todayWeight.toFixed(1)}
                  <span className="ml-0.5 text-[22px] font-bold text-sub">
                    kg
                  </span>
                </div>
                {delta != null && (
                  <div className="rounded-full bg-main px-[11px] py-[5px] text-sm font-bold text-white">
                    {delta > 0 ? "▲" : delta < 0 ? "▼" : "—"}{" "}
                    {Math.abs(delta).toFixed(1)}kg
                  </div>
                )}
              </div>
              <div className="mt-2 text-[13px] font-medium text-sub">
                {delta == null
                  ? "어제 기록이 없어요"
                  : delta < 0
                    ? `어제보다 ${Math.abs(delta).toFixed(1)}kg 줄었어요`
                    : delta > 0
                      ? `어제보다 ${delta.toFixed(1)}kg 늘었어요`
                      : "어제와 같아요"}
              </div>
            </>
          ) : (
            <>
              <div className="mt-1.5 text-[44px] leading-none font-extrabold tracking-[-1.5px] text-mute">
                — <span className="text-[22px] font-bold">kg</span>
              </div>
              {!loading && (
                <Link
                  href={`/day/${today}`}
                  className="mt-3.5 inline-block rounded-full bg-main px-4 py-2 text-sm font-bold text-white"
                >
                  기록하기
                </Link>
              )}
            </>
          )}
        </div>
      </div>

      {/* 캘린더 */}
      <div className="bg-white px-5 pt-2 pb-6">
        <div className="grid grid-cols-7 py-2 text-center text-xs font-semibold text-faint">
          <div className="text-main">일</div>
          <div>월</div>
          <div>화</div>
          <div>수</div>
          <div>목</div>
          <div>금</div>
          <div className="text-blue">토</div>
        </div>
        <div className="grid grid-cols-7 gap-y-0.5">
          {cells.map((d, i) => {
            if (d == null) return <div key={`empty-${i}`} />;
            const iso = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            const isToday = iso === today;
            const isFuture = iso > today;
            const recorded = weights[iso] != null;
            const dow = i % 7;
            const dayColor = isToday
              ? "bg-main text-white"
              : isFuture
                ? "text-mute"
                : dow === 0
                  ? "text-main"
                  : dow === 6
                    ? "text-blue"
                    : "text-ink";

            const cell = (
              <div className="flex h-12 flex-col items-center justify-center gap-1">
                <div
                  className={`flex h-[34px] w-[34px] items-center justify-center rounded-full text-[15px] font-semibold ${dayColor}`}
                >
                  {d}
                </div>
                <div
                  className={`h-[5px] w-[5px] rounded-full ${
                    recorded && !isToday ? "bg-main" : "bg-transparent"
                  }`}
                />
              </div>
            );

            // 미래 날짜는 기록 불가 정책 — 링크 없이 표시만
            return isFuture ? (
              <div key={iso}>{cell}</div>
            ) : (
              <Link key={iso} href={`/day/${iso}`}>
                {cell}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
