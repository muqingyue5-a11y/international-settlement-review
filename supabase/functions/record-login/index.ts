import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") || "";

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await authClient.auth.getUser();
    if (userError || !userData.user) {
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }

    const serviceClient = createClient(supabaseUrl, serviceKey);
    const { data: profile, error: profileError } = await serviceClient
      .from("profiles")
      .select("role,email")
      .eq("id", userData.user.id)
      .single();
    if (profileError || !profile) {
      return new Response("Profile missing", { status: 403, headers: corsHeaders });
    }

    const body = await req.json().catch(() => ({}));
    const forwardedFor = req.headers.get("x-forwarded-for") || "";
    const ip =
      req.headers.get("cf-connecting-ip") ||
      forwardedFor.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "";

    const { error: insertError } = await serviceClient.from("login_events").insert({
      user_id: userData.user.id,
      email: profile.email || userData.user.email,
      role: profile.role,
      ip,
      user_agent: req.headers.get("user-agent") || "",
      device: String(body.device || ""),
    });
    if (insertError) {
      return new Response(insertError.message, { status: 500, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(String(error), { status: 500, headers: corsHeaders });
  }
});
