import { NextResponse } from "next/server";
import { getServerSession, Session } from "next-auth";

import { supabase } from "@/lib/supabase/server";
import {
  getDaysInMonth,
  makeDateKey,
  type CompletionMap,
} from "@/lib/calendarData";
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

async function getUserIdFromSession(session: Session) {
  const email = session.user?.email?.toLowerCase();
  if (!email) {
    return null;
  }

  const { data, error } = await supabase
    .from("users")
    .select("id")
    .ilike("email", email)
    .maybeSingle();

  if (error || !data?.id) {
    return null;
  }

  return data.id;
}

function isValidCompletions(value: unknown): value is CompletionMap {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  for (const dayValue of Object.values(value as Record<string, unknown>)) {
    if (!dayValue || typeof dayValue !== "object" || Array.isArray(dayValue)) {
      return false;
    }

    for (const taskValue of Object.values(
      dayValue as Record<string, unknown>,
    )) {
      if (typeof taskValue !== "boolean") {
        return false;
      }
    }
  }

  return true;
}

export async function GET(req: Request) {
  const session: Session | null = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = await getUserIdFromSession(session);
  if (!userId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
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
    .from("calendar_task_completions")
    .select("day, task_id, completed")
    .eq("user_id", userId)
    .eq("year", parsed.year)
    .eq("month", parsed.month);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const completionMap: CompletionMap = {};

  (data ?? []).forEach((row) => {
    const dateKey = makeDateKey(parsed.year, parsed.month, row.day);

    if (!completionMap[dateKey]) {
      completionMap[dateKey] = {};
    }

    completionMap[dateKey][row.task_id] = row.completed;
  });

  return NextResponse.json({ data: completionMap });
}

export async function PUT(req: Request) {
  const session: Session | null = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = await getUserIdFromSession(session);
  if (!userId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const yearRaw = body?.year;
  const monthRaw = body?.month;
  const completions = body?.completions;

  const parsed = parseYearAndMonth(
    typeof yearRaw === "number" ? String(yearRaw) : null,
    typeof monthRaw === "number" ? String(monthRaw) : null,
  );

  if (!parsed) {
    return NextResponse.json(
      { error: "year and month are required (month: 0-11)" },
      { status: 400 },
    );
  }

  if (!isValidCompletions(completions)) {
    return NextResponse.json(
      {
        error: "completions must be a map of date keys and boolean task states",
      },
      { status: 400 },
    );
  }

  const { error: deleteError } = await supabase
    .from("calendar_task_completions")
    .delete()
    .eq("user_id", userId)
    .eq("year", parsed.year)
    .eq("month", parsed.month);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  const daysInMonth = getDaysInMonth(parsed.year, parsed.month);
  const rows: Array<{
    user_id: string;
    year: number;
    month: number;
    day: number;
    task_id: string;
    completed: boolean;
  }> = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = makeDateKey(parsed.year, parsed.month, day);
    const dayMap = completions[dateKey] ?? {};

    for (const [taskId, completed] of Object.entries(dayMap)) {
      if (!completed) {
        continue;
      }

      rows.push({
        user_id: userId,
        year: parsed.year,
        month: parsed.month,
        day,
        task_id: taskId,
        completed,
      });
    }
  }

  if (rows.length > 0) {
    const { error: insertError } = await supabase
      .from("calendar_task_completions")
      .insert(rows);

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ data: completions }, { status: 200 });
}
