"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { latestEntry, streakOf, type WeightMap } from "@/lib/weights";
import {
  getMyGroupCode,
  getMyProfile,
  getMyWeights,
  getProfiles,
  getSessionUser,
  signOut,
  updateGoal,
  type Profile,
} from "@/lib/data";

export default function MePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState("");
  const [weights, setWeights] = useState<WeightMap>({});
  const [memberCount, setMemberCount] = useState(1);
  const [groupCode, setGroupCode] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [alarmOn, setAlarmOn] = useState(true);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("");

  useEffect(() => {
    Promise.all([
      getMyProfile(),
      getMyWeights(),
      getProfiles(),
      getSessionUser(),
      getMyGroupCode(),
    ]).then(([p, w, all, user, code]) => {
      setProfile(p);
      setWeights(w);
      setMemberCount(Math.max(1, all.length));
      setEmail(user?.email ?? "");
      setGroupCode(code);
    });
  }, []);

  async function copyGroupCode() {
    if (!groupCode) return;
    await navigator.clipboard.writeText(groupCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }

  const latest = latestEntry(weights);
  const current = latest?.weight ?? profile?.start_weight ?? null;
  const start = profile?.start_weight ?? null;
  const goal = profile?.goal_weight ?? null;

  const remaining = current != null && goal != null ? current - goal : null;
  const percent =
    start != null && goal != null && current != null && start !== goal
      ? Math.min(
          100,
          Math.max(0, Math.round(((start - current) / (start - goal)) * 100)),
        )
      : 0;
  const recordDays = Object.keys(weights).length;
  const streak = streakOf(weights);

  async function saveGoal() {
    const v = Number(goalInput);
    if (!goalInput || Number.isNaN(v) || v <= 0) return;
    await updateGoal(v);
    setProfile((p) => (p ? { ...p, goal_weight: v } : p));
    setEditingGoal(false);
  }

  async function logout() {
    await signOut();
    router.replace("/login");
  }

  return (
    <div>
      {/* 프로필 헤더 */}
      <div className="flex items-center gap-4 bg-white px-6 pt-6 pb-7">
        <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-main-light text-[26px] font-extrabold text-main">
          {profile?.name?.[0] ?? ""}
        </div>
        <div className="flex-1">
          <div className="text-[21px] font-extrabold tracking-[-0.5px]">
            {profile?.name ?? ""}
          </div>
          <div className="mt-0.5 text-[13px] font-medium text-sub">
            {email}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3.5 px-5 pt-4">
        {/* 목표 카드 */}
        <div className="rounded-[20px] bg-ink px-6 py-[22px] text-white">
          {goal != null && current != null ? (
            <>
              <div className="flex items-center justify-between">
                <div className="text-[13px] font-semibold text-faint">
                  목표까지
                </div>
                <div className="rounded-full bg-main/16 px-2.5 py-1 text-xs font-semibold text-main">
                  {remaining != null && remaining > 0
                    ? `-${remaining.toFixed(1)}kg 남음`
                    : "목표 달성 🎉"}
                </div>
              </div>
              <div className="mt-2.5 text-[34px] leading-none font-extrabold tracking-[-1px]">
                {current.toFixed(1)}{" "}
                <span className="text-base font-semibold text-sub">
                  → {goal.toFixed(1)}kg
                </span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/12">
                <div
                  className="h-full rounded-full bg-main"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <div className="mt-2.5 text-xs font-medium text-sub">
                {start != null && `시작 ${start.toFixed(1)}kg · `}
                {percent}% 달성
              </div>
            </>
          ) : (
            <>
              <div className="text-[13px] font-semibold text-faint">목표</div>
              <div className="mt-2 text-lg font-bold">
                목표 몸무게를 설정해보세요
              </div>
              <button
                onClick={() => setEditingGoal(true)}
                className="mt-4 rounded-full bg-main px-4 py-2 text-sm font-bold text-white"
              >
                목표 설정하기
              </button>
            </>
          )}
        </div>

        {/* 통계 */}
        <div className="flex gap-3">
          <div className="flex-1 rounded-[18px] border border-line bg-white p-[18px]">
            <div className="text-xs font-semibold text-sub">기록 일수</div>
            <div className="mt-1.5 text-[26px] font-extrabold">
              {recordDays}
              <span className="text-sm text-sub">일</span>
            </div>
          </div>
          <div className="flex-1 rounded-[18px] border border-line bg-white p-[18px]">
            <div className="text-xs font-semibold text-sub">연속 기록</div>
            <div className="mt-1.5 text-[26px] font-extrabold text-main">
              🔥 {streak}
              <span className="text-sm text-sub">일</span>
            </div>
          </div>
        </div>

        {/* 설정 리스트 */}
        <div className="overflow-hidden rounded-[20px] border border-line bg-white">
          <button
            onClick={() => {
              setGoalInput(goal != null ? String(goal) : "");
              setEditingGoal(true);
            }}
            className="flex w-full items-center gap-3.5 border-b border-hair px-5 py-4"
          >
            <div className="text-lg">🎯</div>
            <div className="flex-1 text-left text-[15px] font-semibold">
              목표 몸무게 설정
            </div>
            <span className="text-sm font-semibold text-faint">
              {goal != null ? `${goal.toFixed(1)}kg ` : ""}›
            </span>
          </button>
          <div className="flex items-center gap-3.5 border-b border-hair px-5 py-4">
            <div className="text-lg">👥</div>
            <div className="flex-1 text-[15px] font-semibold">방 멤버</div>
            <span className="text-sm font-semibold text-faint">
              {memberCount}/8명
            </span>
          </div>
          <button
            onClick={copyGroupCode}
            className="flex w-full items-center gap-3.5 border-b border-hair px-5 py-4"
          >
            <div className="text-lg">✉️</div>
            <div className="flex-1 text-left text-[15px] font-semibold">
              초대 코드
            </div>
            <span
              className={`text-sm font-bold ${
                codeCopied ? "text-sub" : "text-main"
              }`}
            >
              {codeCopied ? "복사됨!" : (groupCode ?? "—")}
            </span>
          </button>
          <div className="flex items-center gap-3.5 px-5 py-4">
            <div className="text-lg">🔔</div>
            <div className="flex-1 text-[15px] font-semibold">기록 알림</div>
            <button
              onClick={() => setAlarmOn((v) => !v)}
              className={`relative h-[26px] w-11 rounded-full transition-colors ${
                alarmOn ? "bg-main" : "bg-line-strong"
              }`}
            >
              <span
                className={`absolute top-[3px] h-5 w-5 rounded-full bg-white transition-all ${
                  alarmOn ? "right-[3px]" : "left-[3px]"
                }`}
              />
            </button>
          </div>
        </div>

        <button
          onClick={logout}
          className="pt-1 pb-3 text-center text-sm font-semibold text-sub"
        >
          로그아웃
        </button>
      </div>

      {/* 목표 설정 모달 */}
      {editingGoal && (
        <div
          className="fixed inset-0 z-20 flex items-end justify-center bg-black/40"
          onClick={() => setEditingGoal(false)}
        >
          <div
            className="w-full max-w-[430px] rounded-t-[24px] bg-white p-6 pb-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-lg font-bold">목표 몸무게 설정</div>
            <div className="mt-5 flex items-center justify-between border-b-2 border-main pb-3">
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                min="1"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                placeholder="55.0"
                autoFocus
                className="w-full bg-transparent text-4xl font-extrabold outline-none placeholder:text-mute"
              />
              <div className="text-xl font-bold text-sub">kg</div>
            </div>
            <button
              onClick={saveGoal}
              disabled={!goalInput || Number(goalInput) <= 0}
              className="mt-6 h-14 w-full rounded-2xl bg-main text-[17px] font-bold text-white disabled:bg-mute"
            >
              저장하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
