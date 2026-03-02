import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type UserRole = Database["public"]["Enums"]["user_role"];

interface AuthContextType {
    user: User | null;
    profile: Profile | null;
    session: Session | null;
    loading: boolean;
    isAdmin: boolean;
    isSuperAdmin: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            try {
                // Get initial session
                const { data: { session } } = await supabase.auth.getSession();
                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    await fetchProfile(session.user.id);
                } else if (!window.location.hash.includes('access_token=')) {
                    // Only stop loading if we aren't expecting a hash-based login
                    setLoading(false);
                }
            } catch (error) {
                console.error("Auth initialization error:", error);
                setLoading(false);
            }
        };

        initAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log("Auth event:", event);
            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {
                fetchProfile(session.user.id);

                // Clean up the URL by removing the hash fragments after successful login
                if (window.location.hash.includes('access_token=')) {
                    window.history.replaceState(null, "", window.location.pathname + window.location.search);
                }
            } else {
                setProfile(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", userId)
                .single();

            if (error) {
                console.error("Error fetching profile:", error);
            } else {
                setProfile(data);
            }
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    const isAdmin = profile?.role === "admin" || profile?.role === "super_admin";
    const isSuperAdmin = profile?.role === "super_admin";

    return (
        <AuthContext.Provider value={{ user, profile, session, loading, isAdmin, isSuperAdmin, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
