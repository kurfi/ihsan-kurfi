import { ShieldX, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function Blocked() {
    const { signOut, user } = useAuth();

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
            <div className="absolute inset-0 bg-destructive/5 backdrop-blur-sm z-0" />

            <Card className="w-full max-w-md relative z-10 shadow-2xl border-destructive/10">
                <CardHeader className="space-y-4 text-center pb-8 pt-10">
                    <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center border border-destructive/20 shadow-inner">
                        <ShieldX className="w-8 h-8 text-destructive" />
                    </div>
                    <div className="space-y-2">
                        <CardTitle className="text-2xl font-bold tracking-tight text-destructive">Account Blocked</CardTitle>
                        <CardDescription className="text-sm px-4">
                            Your access to this system has been suspended.
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="text-center space-y-4">
                    <p className="text-muted-foreground">
                        User email: <span className="font-semibold text-foreground">{user?.email}</span>.
                    </p>
                    <p className="text-sm text-muted-foreground px-6">
                        An administrator has blocked your account. You will not be able to access any system features until your account is reinstated.
                    </p>
                    <div className="p-4 bg-destructive/5 rounded-lg border border-destructive/10 text-xs text-destructive/80 font-medium">
                        If you believe this is a mistake, please contact your Super Admin for clarification.
                    </div>
                </CardContent>

                <CardFooter className="pt-4 pb-8 flex flex-col space-y-4">
                    <Button
                        variant="outline"
                        className="w-full flex items-center justify-center gap-2 hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30"
                        onClick={() => signOut()}
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
