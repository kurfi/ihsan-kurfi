import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // Create admin Supabase client using SERVICE_ROLE key
        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        // Verify the calling user from their JWT
        const authHeader = req.headers.get("Authorization")!;
        const supabaseUser = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? "",
            { global: { headers: { Authorization: authHeader } } }
        );

        const { data: { user: callingUser }, error: authError } = await supabaseUser.auth.getUser();
        if (authError || !callingUser) {
            return new Response(
                JSON.stringify({ error: "Unauthorized" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Check caller's role from profiles
        const { data: callerProfile } = await supabaseAdmin
            .from("profiles")
            .select("role")
            .eq("id", callingUser.id)
            .single();

        if (!callerProfile || !['super_admin', 'admin'].includes(callerProfile.role)) {
            return new Response(
                JSON.stringify({ error: "Forbidden: Only Super Admins and Admins can delete users" }),
                { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const { userId } = await req.json();

        if (!userId) {
            return new Response(
                JSON.stringify({ error: "userId is required" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Prevent deleting yourself
        if (userId === callingUser.id) {
            return new Response(
                JSON.stringify({ error: "You cannot delete your own account" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Get target user info for logging before deletion
        const { data: targetUser } = await supabaseAdmin.auth.admin.getUserById(userId);
        const targetEmail = targetUser?.user?.email ?? 'unknown';

        // Delete the user via admin API
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (deleteError) {
            return new Response(
                JSON.stringify({ error: deleteError.message }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Log the action
        await supabaseAdmin.from('audit_logs').insert({
            user_id: callingUser.id,
            action: 'Deleted User',
            entity_type: 'users',
            entity_id: userId,
            details: { email: targetEmail }
        });

        return new Response(
            JSON.stringify({ message: "User deleted successfully" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (err) {
        return new Response(
            JSON.stringify({ error: err instanceof Error ? err.message : "An unexpected error occurred" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
