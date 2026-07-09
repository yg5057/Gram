"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getMyProfile } from "@/lib/data";

// 로그인은 했지만 아직 방이 없는 사용자를 온보딩으로 보낸다.
// 로그인 가드 자체는 proxy.ts가 처리한다.
export default function GroupGuard() {
  const router = useRouter();

  useEffect(() => {
    getMyProfile().then((p) => {
      if (p && p.group_id == null) router.replace("/welcome");
    });
  }, [router]);

  return null;
}
