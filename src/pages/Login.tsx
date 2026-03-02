import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Loader2, Lock, Mail } from "lucide-react";

// Google SVG icon — no extra dependency needed
function GoogleIcon() {
    return (
        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
    );
}

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                toast({
                    variant: "destructive",
                    title: "Login Failed",
                    description: error.message,
                });
            } else {
                // Log the login event
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    await supabase.from('audit_logs').insert({
                        user_id: user.id,
                        action: 'User Logged In',
                        entity_type: 'auth',
                    });
                }

                navigate("/");
                toast({
                    title: "Welcome back!",
                    description: "You have successfully logged in.",
                });
            }
        } catch (err: any) {
            toast({
                variant: "destructive",
                title: "An unexpected error occurred",
                description: err.message,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setGoogleLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    // Redirect back to the app root after Google auth
                    redirectTo: `${window.location.origin}/`,
                },
            });

            if (error) {
                toast({
                    variant: "destructive",
                    title: "Google Sign-In Failed",
                    description: error.message,
                });
                setGoogleLoading(false);
            }
            // On success, browser is redirected to Google — no further action needed here.
            // The session will be picked up by onAuthStateChange in useAuth.tsx.
        } catch (err: any) {
            toast({
                variant: "destructive",
                title: "An unexpected error occurred",
                description: err.message,
            });
            setGoogleLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-0" />

            <Card className="w-full max-w-md relative z-10 shadow-2xl border-primary/10">
                <CardHeader className="space-y-4 text-center pb-8 pt-10">
                    <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                        <Building2 className="w-8 h-8 text-primary" />
                    </div>
                    <div className="space-y-2">
                        <CardTitle className="text-2xl font-bold tracking-tight">IHSAN Blocks</CardTitle>
                        <CardDescription className="text-sm px-4">
                            Enter your credentials to access the management portal
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* Google Sign-In Button */}
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full font-medium border-border hover:bg-accent"
                        onClick={handleGoogleSignIn}
                        disabled={googleLoading || loading}
                    >
                        {googleLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <GoogleIcon />
                        )}
                        Continue with Google
                    </Button>

                    {/* Divider */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground">or sign in with email</span>
                        </div>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="admin@ihsanblocks.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10 bg-background"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                                    <Lock className="w-4 h-4" />
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10 bg-background"
                                    required
                                />
                            </div>
                        </div>

                        <Button type="submit" className="w-full font-medium gradient-primary" disabled={loading || googleLoading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Authenticating...
                                </>
                            ) : (
                                "Sign In"
                            )}
                        </Button>
                    </form>
                </CardContent>

                <CardFooter className="flex flex-col space-y-4 pt-4 pb-8 text-center text-sm text-muted-foreground">
                    <p>
                        Secure access restricted to authorized personnel.
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
