import { supabase } from "@/lib/supabase/server";
import { authOptions } from "../auth/[...nextauth]/route";
import { getServerSession, Session } from "next-auth";
import { NextResponse } from "next/server";

type TodoInput = {
  id: string;
  text: string;
  completed: boolean;
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

function isValidTodoArray(value: unknown): value is TodoInput[] {
  if (!Array.isArray(value)) return false;

  return value.every((task) => {
    if (!task || typeof task !== "object") return false;

    const maybeTask = task as Partial<TodoInput>;
    return (
      typeof maybeTask.id === "string" &&
      maybeTask.id.trim().length > 0 &&
      typeof maybeTask.text === "string" &&
      typeof maybeTask.completed === "boolean"
    );
  });
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
    .from("calendar_todos")
    .select("task_id, text, completed")
    .eq("user_id", userId)
    .eq("year", parsed.year)
    .eq("month", parsed.month)
    .order("position", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const response = (data ?? []).map((row) => ({
    id: row.task_id,
    text: row.text,
    completed: row.completed,
  }));

  return NextResponse.json({ data: response });
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

  if (!isValidTodoArray(tasks)) {
    return NextResponse.json(
      { error: "tasks must be an array of { id, text, completed }" },
      { status: 400 },
    );
  }

  const { error: deleteError } = await supabase
    .from("calendar_todos")
    .delete()
    .eq("user_id", userId)
    .eq("year", parsed.year)
    .eq("month", parsed.month);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  if (tasks.length > 0) {
    const rows = tasks.map((task, index) => ({
      user_id: userId,
      year: parsed.year,
      month: parsed.month,
      task_id: task.id,
      text: task.text,
      completed: task.completed,
      position: index,
    }));

    const { error: insertError } = await supabase
      .from("calendar_todos")
      .insert(rows);

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ data: tasks }, { status: 200 });
}
