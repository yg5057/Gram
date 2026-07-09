"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createGroup, getMyProfile, joinGroup, signOut } from "@/lib/data";

export default function WelcomePage() {
  const router = useRouter();
  const [newCode, setNewCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // 이미 방이 있으면 홈으로
  useEffect(() => {
    getMyProfile().then((p) => {
      if (p?.group_id != null) router.replace("/");
    });
  }, [router]);

  async function handleCreate() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      setNewCode(await createGroup());
    } catch {
      setError("방 만들기에 실패했어요. 잠시 후 다시 시도해주세요");
    } finally {
      setBusy(false);
    }
  }

  async function copyCode() {
    if (!newCode) return;
    await navigator.clipboard.writeText(newCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleJoin() {
    if (busy || !joinCode.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await joinGroup(joinCode);
      router.replace("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "입장에 실패했어요");
      setBusy(false);
    }
  }

  async function logout() {
    await signOut();
    router.replace("/login");
  }

  return (
    <div className="flex flex-1 flex-col bg-white px-6 pt-14">
      <div className="text-[24px] font-extrabold tracking-[-0.5px]">
        함께할 방을 만들어요
      </div>
      <div className="mt-2 text-[15px] font-medium text-sub">
        친구들과 몸무게를 공유하려면 방이 필요해요
      </div>

      {/* 방 만들기 */}
      <div className="mt-8 rounded-[20px] border border-line bg-page p-6">
        <div className="text-[17px] font-bold">새 방 만들기</div>
        <div className="mt-1 text-[13px] font-medium text-sub">
          초대 코드를 받아 친구에게 공유하세요 (최대 8명)
        </div>

        {newCode == null ? (
          <button
            onClick={handleCreate}
            disabled={busy}
            className="mt-5 h-[52px] w-full rounded-2xl bg-main text-base font-bold text-white shadow-[0_8px_20px_rgba(255,107,157,0.35)] transition-colors hover:bg-main-dark disabled:opacity-60"
          >
            가입 코드 받기
          </button>
        ) : (
          <>
            <div className="mt-5 flex items-center justify-between rounded-2xl bg-white px-5 py-4">
              <div className="text-[28px] font-extrabold tracking-[6px]">
                {newCode}
              </div>
              <button
                onClick={copyCode}
                className={`rounded-xl px-3.5 py-2 text-[13px] font-bold ${
                  copied ? "bg-line text-sub" : "bg-main-light text-main-dark"
                }`}
              >
                {copied ? "복사됨!" : "복사"}
              </button>
            </div>
            <div className="mt-2.5 text-center text-xs font-medium text-faint">
              이 코드는 내정보 화면에서 언제든 다시 볼 수 있어요
            </div>
            <button
              onClick={() => router.replace("/")}
              className="mt-4 h-[52px] w-full rounded-2xl bg-main text-base font-bold text-white shadow-[0_8px_20px_rgba(255,107,157,0.35)]"
            >
              시작하기
            </button>
          </>
        )}
      </div>

      <div className="my-6 flex items-center gap-3.5">
        <div className="h-px flex-1 bg-line" />
        <div className="text-xs font-medium text-faint">또는</div>
        <div className="h-px flex-1 bg-line" />
      </div>

      {/* 코드로 입장 */}
      <div className="rounded-[20px] border border-line bg-page p-6">
        <div className="text-[17px] font-bold">코드로 입장하기</div>
        <div className="mt-1 text-[13px] font-medium text-sub">
          친구에게 받은 초대 코드를 입력하세요
        </div>
        <input
          type="text"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          placeholder="ABC123"
          maxLength={6}
          autoCapitalize="characters"
          disabled={newCode != null}
          className="mt-5 h-[52px] w-full rounded-2xl border border-line-strong bg-white px-5 text-center text-lg font-extrabold tracking-[6px] outline-none placeholder:font-medium placeholder:tracking-normal placeholder:text-faint focus:border-main disabled:opacity-40"
        />
        <button
          onClick={handleJoin}
          disabled={busy || joinCode.trim().length < 6 || newCode != null}
          className="mt-3 h-[52px] w-full rounded-2xl bg-ink text-base font-bold text-white disabled:bg-mute"
        >
          입장하기
        </button>
      </div>

      {error && (
        <div className="mt-4 text-center text-[13px] font-medium text-main-dark">
          {error}
        </div>
      )}

      <button
        onClick={logout}
        className="mt-auto mb-8 pt-6 text-center text-[13px] font-semibold text-sub"
      >
        로그아웃
      </button>
    </div>
  );
}
