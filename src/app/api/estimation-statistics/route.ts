import { supabase } from "@/lib/supabase/server";
import { authOptions } from "../auth/[...nextauth]/route";
import { Session, getServerSession } from "next-auth";
import { NextResponse } from "next/server";

type Body = {
  providerIds: string[];
};

export async function POST(req: Request) {
  const session: Session | null = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body: Body = await req.json();
  const { providerIds } = body;

  if (!Array.isArray(providerIds) || providerIds.length === 0) {
    return NextResponse.json(
      { error: "providerIds must be a non-empty array" },
      { status: 400 },
    );
  }

  const uniqueProviderIds = Array.from(new Set(providerIds));

  // Create estimation_statistics row
  const { data: estimation, error: estErr } = await supabase
    .from("estimations_statistics")
    .insert({})
    .select("id")
    .single();

  if (estErr || !estimation) {
    return NextResponse.json(
      { error: estErr?.message ?? "Failed to create estimation" },
      { status: 500 },
    );
  }

  const joinRows = uniqueProviderIds.map((providerId) => ({
    estimation_id: estimation.id,
    provider_id: providerId,
  }));

  const { error: joinErr } = await supabase
    .from("estimations_statistics_providers")
    .insert(joinRows);

  if (joinErr) {
    // Optional cleanup: delete the estimation row if join insert fails
    await supabase
      .from("estimations_statistics")
      .delete()
      .eq("id", estimation.id);

    return NextResponse.json(
      { error: joinErr.message ?? "Failed to link providers" },
      { status: 500 },
    );
  }

  return NextResponse.json({ estimationId: estimation.id }, { status: 201 });
}
