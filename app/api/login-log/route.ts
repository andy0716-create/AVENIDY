import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("Supabase server environment variables are not configured.");
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = getAdminClient();
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = userData.user;
    const forwardedFor = req.headers.get("x-forwarded-for") || "";
    const ip = forwardedFor.split(",")[0]?.trim() || req.headers.get("x-real-ip") || null;
    const userAgent = req.headers.get("user-agent") || null;

    const { error } = await supabase.from("login_logs").insert({
      user_id: user.id,
      email: user.email ?? null,
      logged_in_at: new Date().toISOString(),
      user_agent: userAgent,
      ip_address: ip,
      success: true,
      provider: user.app_metadata?.provider ?? "email",
    });

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("login-log error", error);
    return NextResponse.json({ error: "Could not record login" }, { status: 500 });
  }
}
