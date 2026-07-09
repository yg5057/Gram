import { notFound } from "next/navigation";
import { isValidISO } from "@/lib/date";
import DayClient from "./day-client";

export default async function DayPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  if (!isValidISO(date)) notFound();
  return <DayClient date={date} />;
}
