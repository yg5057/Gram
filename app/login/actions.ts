"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function login(email: string, password: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) return { error: "이메일 또는 비밀번호가 올바르지 않아요" };
  redirect("/");
}

export async function signup(input: {
  email: string;
  password: string;
  name: string;
}) {
  const { email, password, name } = input;

  if (!name.trim()) return { error: "이름을 입력해주세요" };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    if (error.code === "user_already_exists")
      return { error: "이미 가입된 이메일이에요" };
    if (error.code === "weak_password" || error.code === "validation_failed")
      return { error: "이메일 형식과 비밀번호(6자 이상)를 확인해주세요" };
    return { error: "가입에 실패했어요. 잠시 후 다시 시도해주세요" };
  }
  if (!data.session || !data.user) {
    return {
      error:
        "이메일 확인 설정이 켜져 있어요. Supabase → Authentication → Sign In / Providers에서 Confirm email을 꺼주세요",
    };
  }

  // 색상은 방 만들기/입장 시 방 단위로 다시 배정된다 (DB 함수)
  const { error: profileError } = await supabase
    .from("users")
    .insert({ id: data.user.id, name: name.trim(), color: "#FF6B9D" });
  if (profileError) return { error: "프로필 생성에 실패했어요" };

  // 가입 직후 방 만들기 / 코드 입장 선택 화면으로
  redirect("/welcome");
}
