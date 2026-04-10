import { NextResponse } from "next/server";
import { getServerSession, Session } from "next-auth";

import { supabase } from "@/lib/supabase/server";
import { authOptions } from "../../auth/[...nextauth]/route";

type PredefinedTaskInput = {
  id: string;
  label: string;
};

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

function ensureAdmin(session: Session | null) {
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user?.role !== "admin" && session.user?.role !== "superadmin") {
    return NextResponse.json(
      { error: "Only admins can perform this action" },
      { status: 401 },
    );
  }

  return null;
}

function isValidTaskArray(value: unknown): value is PredefinedTaskInput[] {
  if (!Array.isArray(value)) return false;

  return value.every((task) => {
    if (!task || typeof task !== "object") return false;

    const maybeTask = task as Partial<PredefinedTaskInput>;
    return (
      typeof maybeTask.id === "string" &&
      maybeTask.id.trim().length > 0 &&
      typeof maybeTask.label === "string" &&
      maybeTask.label.trim().length > 0
    );
  });
}

function toTaskId(value: string) {
  const cleaned = value
    .trim()
    .replace(/[^a-zA-Z0-9\s-_]/g, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ");

  const parts = cleaned
    .split(" ")
    .map((part) => part.toLowerCase())
    .filter(Boolean);

  if (parts.length === 0) {
    return "task";
  }

  return parts
    .map((part, index) => {
      if (index === 0) return part;
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join("");
}

function withUniqueIds(tasks: PredefinedTaskInput[]) {
  const seen = new Set<string>();

  return tasks.map((task) => {
    const base = toTaskId(task.id || task.label);
    let candidate = base;
    let counter = 2;

    while (seen.has(candidate)) {
      candidate = `${base}${counter}`;
      counter += 1;
    }

    seen.add(candidate);

    return {
      id: candidate,
      label: task.label.trim(),
    };
  });
}

export async function GET(req: Request) {
  const session: Session | null = await getServerSession(authOptions);
  const authError = ensureAdmin(session);
  if (authError) return authError;

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

  const response = (data ?? []).map((row) => ({
    id: row.task_id,
    label: row.label,
  }));

  return NextResponse.json({ data: response });
}

export async function POST(req: Request) {
  const session: Session | null = await getServerSession(authOptions);
  const authError = ensureAdmin(session);
  if (authError) return authError;

  const body = await req.json().catch(() => null);
  const yearRaw = body?.year;
  const monthRaw = body?.month;
  const labelRaw = typeof body?.label === "string" ? body.label.trim() : "";
  const preferredIdRaw =
    typeof body?.id === "string" ? body.id.trim() : undefined;

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

  if (!labelRaw) {
    return NextResponse.json({ error: "label is required" }, { status: 400 });
  }

  const { data: existingRows, error: existingError } = await supabase
    .from("calendar_predefined_tasks_monthly")
    .select("task_id, position")
    .eq("year", parsed.year)
    .eq("month", parsed.month)
    .order("position", { ascending: false });

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  const existingIds = new Set((existingRows ?? []).map((row) => row.task_id));
  const baseId = toTaskId(preferredIdRaw ?? labelRaw);

  let taskId = baseId;
  let counter = 2;

  while (existingIds.has(taskId)) {
    taskId = `${baseId}${counter}`;
    counter += 1;
  }

  const position =
    existingRows && existingRows.length > 0 ? existingRows[0].position + 1 : 0;

  const { error: insertError } = await supabase
    .from("calendar_predefined_tasks_monthly")
    .insert({
      year: parsed.year,
      month: parsed.month,
      task_id: taskId,
      label: labelRaw,
      position,
    });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json(
    { data: { id: taskId, label: labelRaw } },
    { status: 201 },
  );
}

export async function PUT(req: Request) {
  const session: Session | null = await getServerSession(authOptions);
  const authError = ensureAdmin(session);
  if (authError) return authError;

  const body = await req.json().catch(() => null);
  const yearRaw = body?.year;
  const monthRaw = body?.month;
  const tasks = body?.tasks;

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

  if (!isValidTaskArray(tasks)) {
    return NextResponse.json(
      { error: "tasks must be an array of { id, label }" },
      { status: 400 },
    );
  }

  const normalized = withUniqueIds(
    tasks.map((task) => ({ id: task.id.trim(), label: task.label.trim() })),
  );

  const { error: deleteError } = await supabase
    .from("calendar_predefined_tasks_monthly")
    .delete()
    .eq("year", parsed.year)
    .eq("month", parsed.month);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  if (normalized.length > 0) {
    const rows = normalized.map((task, index) => ({
      year: parsed.year,
      month: parsed.month,
      task_id: task.id,
      label: task.label,
      position: index,
    }));

    const { error: insertError } = await supabase
      .from("calendar_predefined_tasks_monthly")
      .insert(rows);

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ data: normalized }, { status: 200 });
}
