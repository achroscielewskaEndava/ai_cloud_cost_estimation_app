import { supabase } from "@/lib/supabase/server";
import { authOptions } from "../auth/[...nextauth]/route";
import { getServerSession, Session } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session: Session | null = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user?.role !== "superadmin") {
    return NextResponse.json(
      { error: "Only superadmins can perform this action" },
      { status: 401 },
    );
  }

  const { data, error } = await supabase
    .from("users")
    .select("email, name, role")
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const session: Session | null = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user?.role !== "superadmin") {
    return NextResponse.json(
      { error: "Only superadmins can perform this action" },
      { status: 401 },
    );
  }

  const body = await req.json().catch(() => null);
  const emailRaw = body?.email?.trim();
  const role = body?.role?.trim();
  const allowedRoles = ["admin", "user", "superadmin"];

  if (!emailRaw) {
    return NextResponse.json(
      { error: "Email is required to update user role" },
      { status: 400 },
    );
  }

  const email = emailRaw.toLowerCase();
  const requesterEmail = session.user?.email?.toLowerCase();

  if (requesterEmail && email === requesterEmail) {
    return NextResponse.json(
      { error: "You cannot change your own role" },
      { status: 403 },
    );
  }

  if (!role || !allowedRoles.includes(role)) {
    return NextResponse.json(
      { error: "Role must be either 'admin', 'user', or 'superadmin'" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("users")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("email", email)
    .select("email, name, role")
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json(
        { error: "User not found for the provided email" },
        { status: 404 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 200 });
}
