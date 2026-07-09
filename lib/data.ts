// 클라이언트 컴포넌트에서 쓰는 Supabase 데이터 레이어.
// 읽기 권한은 RLS가 통제한다 (프로필/기록은 그룹 전원이 읽기 가능, 쓰기는 본인만).

import { createClient } from "./supabase/client";
import { round1, type WeightMap } from "./weights";

export type Profile = {
  id: string;
  name: string;
  color: string;
  group_id: number | null;
  start_weight: number | null;
  goal_weight: number | null;
};

export async function getSessionUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getProfiles(): Promise<Profile[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, name, color, group_id, start_weight, goal_weight")
    .not("group_id", "is", null)
    .order("created_at");
  if (error) throw error;
  return data;
}

export async function getMyProfile(): Promise<Profile | null> {
  const user = await getSessionUser();
  if (!user) return null;
  const supabase = createClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, name, color, group_id, start_weight, goal_weight")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** 방 만들기: 랜덤 초대 코드를 발급받고 그 방에 입장한다 */
export async function createGroup(): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("create_group");
  if (error) throw error;
  return data as string;
}

/** 초대 코드로 방 입장. 실패 사유는 한글 메시지로 던진다 */
export async function joinGroup(code: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("join_group", { p_code: code });
  if (error) {
    if (error.message.includes("GROUP_NOT_FOUND"))
      throw new Error("존재하지 않는 코드예요");
    if (error.message.includes("GROUP_FULL"))
      throw new Error("방이 가득 찼어요 (최대 8명)");
    if (error.message.includes("ALREADY_IN_GROUP"))
      throw new Error("이미 방에 들어가 있어요");
    throw new Error("입장에 실패했어요. 잠시 후 다시 시도해주세요");
  }
}

/** 내 방의 초대 코드 (방이 없으면 null) */
export async function getMyGroupCode(): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("groups")
    .select("code")
    .maybeSingle();
  if (error) throw error;
  return data?.code ?? null;
}

function toMap(rows: { date: string; weight: number }[]): WeightMap {
  const map: WeightMap = {};
  for (const r of rows) map[r.date] = Number(r.weight);
  return map;
}

export async function getMyWeights(): Promise<WeightMap> {
  const user = await getSessionUser();
  if (!user) return {};
  const supabase = createClient();
  const { data, error } = await supabase
    .from("weights")
    .select("date, weight")
    .eq("user_id", user.id);
  if (error) throw error;
  return toMap(data);
}

/** sinceISO 이후 전원의 기록: userId → WeightMap */
export async function getAllWeights(
  sinceISO: string,
): Promise<Record<string, WeightMap>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("weights")
    .select("user_id, date, weight")
    .gte("date", sinceISO);
  if (error) throw error;
  const out: Record<string, WeightMap> = {};
  for (const r of data) {
    (out[r.user_id] ??= {})[r.date] = Number(r.weight);
  }
  return out;
}

export async function saveWeight(iso: string, weight: number): Promise<void> {
  const user = await getSessionUser();
  if (!user) throw new Error("로그인이 필요해요");
  const supabase = createClient();
  const { error } = await supabase
    .from("weights")
    .upsert(
      { user_id: user.id, date: iso, weight: round1(weight) },
      { onConflict: "user_id,date" },
    );
  if (error) throw error;

  // 첫 기록이면 목표 달성률의 기준이 되는 시작 몸무게로 저장
  const { data: profile } = await supabase
    .from("users")
    .select("start_weight")
    .eq("id", user.id)
    .maybeSingle();
  if (profile && profile.start_weight == null) {
    await supabase
      .from("users")
      .update({ start_weight: round1(weight) })
      .eq("id", user.id);
  }
}

export async function updateGoal(goal: number): Promise<void> {
  const user = await getSessionUser();
  if (!user) throw new Error("로그인이 필요해요");
  const supabase = createClient();
  const { error } = await supabase
    .from("users")
    .update({ goal_weight: round1(goal) })
    .eq("id", user.id);
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
}
