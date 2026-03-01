import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Loader2, Lock, Mail } from "lucide-react";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
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
                // Optionally fetch profile and audit log the login event
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
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-6">
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
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                            </div>
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

                        <Button type="submit" className="w-full font-medium" disabled={loading}>
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
