"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { addDaysISO, formatKorean, isFutureISO, todayISO } from "@/lib/date";
import { round1, type WeightMap } from "@/lib/weights";
import { getMyWeights, saveWeight } from "@/lib/data";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"];

export default function DayClient({ date }: { date: string }) {
  const router = useRouter();
  const [weights, setWeights] = useState<WeightMap>({});
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const future = isFutureISO(date);

  useEffect(() => {
    getMyWeights().then((w) => {
      setWeights(w);
      if (w[date] != null) setInput(w[date].toFixed(1));
    });
  }, [date]);

  function press(key: string) {
    if (future) return;
    setInput((cur) => {
      if (key === "⌫") return cur.slice(0, -1);
      if (key === ".") {
        if (cur === "" || cur.includes(".")) return cur;
        return cur + ".";
      }
      // 정수 3자리, 소수 1자리(999.9)까지만
      const [int, dec] = cur.split(".");
      if (dec !== undefined) {
        if (dec.length >= 1) return cur;
      } else if (int.length >= 3) {
        return cur;
      }
      return cur + key;
    });
  }

  const value = input === "" || input === "." ? null : Number(input);
  const valid = value != null && value > 0 && !Number.isNaN(value);

  const prev = weights[addDaysISO(date, -1)];
  const delta = valid && prev != null ? round1(value - prev) : null;

  async function save() {
    if (!valid || future || saving) return;
    setSaving(true);
    setError(null);
    try {
      await saveWeight(date, value);
      router.push("/");
    } catch {
      setError("저장에 실패했어요. 잠시 후 다시 시도해주세요");
      setSaving(false);
    }
  }

  const isToday = date === todayISO();

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center gap-3 bg-white px-5 pt-1.5 pb-4">
        <Link href="/" className="text-2xl font-semibold text-sub">
          ‹
        </Link>
        <div className="text-[17px] font-bold">{formatKorean(date)}</div>
      </div>

      <div className="p-5">
        {/* 큰 숫자 표시 */}
        <div className="pt-9 pb-7 text-center">
          <div className="text-sm font-semibold text-sub">
            {isToday ? "오늘 몸무게" : "이날 몸무게"}
          </div>
          <div className="mt-3 text-[72px] leading-none font-extrabold tracking-[-3px]">
            {valid ? value.toFixed(1) : "—"}
            <span className="text-[30px] font-bold text-sub"> kg</span>
          </div>
          {delta != null && (
            <div className="mt-[18px] inline-flex items-center gap-1 rounded-full bg-main-light px-4 py-2 text-base font-bold text-main-dark">
              {delta > 0 ? "▲" : delta < 0 ? "▼" : "—"} 어제보다{" "}
              {Math.abs(delta).toFixed(1)}kg
            </div>
          )}
          {future && (
            <div className="mt-[18px] inline-flex items-center rounded-full bg-line px-4 py-2 text-sm font-semibold text-sub">
              미래 날짜는 기록할 수 없어요
            </div>
          )}
        </div>

        {/* 입력 카드 + 키패드 */}
        <div className="rounded-[20px] border border-line bg-white px-6 py-[22px] shadow-[0_2px_12px_rgba(25,31,40,0.04)]">
          <div className="mb-3.5 text-[13px] font-semibold text-sub">
            몸무게 입력
          </div>
          <div className="flex items-center justify-between border-b-2 border-main pb-3">
            <div className="text-4xl font-extrabold">
              {input || <span className="text-mute">0.0</span>}
              <span className="ml-1 inline-block h-[34px] w-0.5 animate-pulse bg-main align-middle" />
            </div>
            <div className="text-xl font-bold text-sub">kg</div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {KEYS.map((key) => (
              <button
                key={key}
                onClick={() => press(key)}
                disabled={future}
                className={`rounded-xl py-4 text-[22px] font-semibold active:bg-page disabled:opacity-30 ${
                  key === "." || key === "⌫" ? "text-sub" : "text-ink"
                }`}
              >
                {key}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mt-3 text-center text-[13px] font-medium text-main-dark">
            {error}
          </div>
        )}

        <button
          onClick={save}
          disabled={!valid || future || saving}
          className="mt-[18px] h-14 w-full rounded-2xl bg-main text-[17px] font-bold text-white shadow-[0_8px_20px_rgba(255,107,157,0.35)] transition-colors hover:bg-main-dark disabled:bg-mute disabled:shadow-none"
        >
          {saving ? "저장 중..." : "저장하기"}
        </button>
      </div>
    </div>
  );
}
