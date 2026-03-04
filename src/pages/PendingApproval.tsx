import { ShieldAlert, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function PendingApproval() {
    const { signOut, user } = useAuth();

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-0" />

            <Card className="w-full max-w-md relative z-10 shadow-2xl border-primary/10">
                <CardHeader className="space-y-4 text-center pb-8 pt-10">
                    <div className="mx-auto w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center border border-yellow-200 shadow-inner">
                        <ShieldAlert className="w-8 h-8 text-yellow-600" />
                    </div>
                    <div className="space-y-2">
                        <CardTitle className="text-2xl font-bold tracking-tight">Account Pending</CardTitle>
                        <CardDescription className="text-sm px-4">
                            Your account is currently waiting for authorization.
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="text-center space-y-4">
                    <p className="text-muted-foreground">
                        Welcome, <span className="font-semibold text-foreground">{user?.email}</span>.
                    </p>
                    <p className="text-sm text-muted-foreground px-6">
                        Before you can access the management portal, a Super Admin must authenticate your account and assign you a role.
                    </p>
                    <div className="p-4 bg-muted/50 rounded-lg border border-border/50 text-xs text-muted-foreground">
                        Please contact your administrator if you believe this is an error or if you've been waiting for more than 24 hours.
                    </div>
                </CardContent>

                <CardFooter className="pt-4 pb-8 flex flex-col space-y-4">
                    <Button
                        variant="outline"
                        className="w-full flex items-center justify-center gap-2"
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
