import { addDaysISO, todayISO } from "./date";

/** 날짜(ISO) → 몸무게(kg) */
export type WeightMap = Record<string, number>;

export function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

/** 전날 대비 증감. 어느 한쪽 기록이 없으면 null */
export function deltaFor(weights: WeightMap, iso: string): number | null {
  const cur = weights[iso];
  const prev = weights[addDaysISO(iso, -1)];
  if (cur == null || prev == null) return null;
  return round1(cur - prev);
}

export function latestEntry(
  weights: WeightMap,
): { iso: string; weight: number } | null {
  const isos = Object.keys(weights).sort();
  if (isos.length === 0) return null;
  const iso = isos[isos.length - 1];
  return { iso, weight: weights[iso] };
}

/** 오늘(오늘 기록이 없으면 어제)부터 거꾸로 이어지는 연속 기록 일수 */
export function streakOf(weights: WeightMap): number {
  let iso = todayISO();
  if (weights[iso] == null) iso = addDaysISO(iso, -1);
  let n = 0;
  while (weights[iso] != null) {
    n++;
    iso = addDaysISO(iso, -1);
  }
  return n;
}

/** 오늘까지 최근 days일의 시계열 (기록 없는 날은 weight null) */
export function seriesFor(
  weights: WeightMap,
  days: number,
): { iso: string; weight: number | null }[] {
  const today = todayISO();
  const out: { iso: string; weight: number | null }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const iso = addDaysISO(today, -i);
    out.push({ iso, weight: weights[iso] ?? null });
  }
  return out;
}

export function fmtDelta(d: number): string {
  if (d > 0) return `▲ ${d.toFixed(1)}`;
  if (d < 0) return `▼ ${Math.abs(d).toFixed(1)}`;
  return `— 0.0`;
}
