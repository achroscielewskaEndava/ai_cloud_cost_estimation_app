import { NextResponse } from "next/server";
import { getServerSession, Session } from "next-auth";

import { supabase } from "@/lib/supabase/server";
import { authOptions } from "../auth/[...nextauth]/route";

function parseYearAndMonth(yearRaw: string | null, monthRaw: string | null) {
  const year = Number(yearRaw);
  const month = Number(monthRaw);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    year < 1970 ||
    year > 9999 ||
    month < 0 ||
    month > 11
  ) {
    return null;
  }

  return { year, month };
}

export async function GET(req: Request) {
  const session: Session | null = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const parsed = parseYearAndMonth(
    searchParams.get("year"),
    searchParams.get("month"),
  );

  if (!parsed) {
    return NextResponse.json(
      { error: "year and month are required (month: 0-11)" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("calendar_predefined_tasks_monthly")
    .select("task_id, label")
    .eq("year", parsed.year)
    .eq("month", parsed.month)
    .order("position", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data: (data ?? []).map((row) => ({
      id: row.task_id,
      label: row.label,
    })),
  });
}
