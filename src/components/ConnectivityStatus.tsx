import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, CheckCircle2, WifiOff } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function ConnectivityStatus() {
    const [status, setStatus] = useState<"checking" | "connected" | "disconnected">("checking");
    const [isVisible, setIsVisible] = useState(false);

    const checkConnection = async () => {
        setStatus("checking");
        try {
            const { error } = await supabase.from("orders").select("count", { count: "exact", head: true });
            if (error && error.code !== "PGRST116") { // Ignore "0 rows" or similar non-connection errors if possible, but count head is safe
                console.error("Connection check failed:", error);
                setStatus("disconnected");
                setIsVisible(true);
            } else {
                setStatus("connected");
                // Hide after success if it was previously showing error, or just stay hidden
                if (status === "disconnected") {
                    setTimeout(() => setIsVisible(false), 3000);
                }
            }
        } catch (err) {
            console.error("Connection check exception:", err);
            setStatus("disconnected");
            setIsVisible(true);
        }
    };

    useEffect(() => {
        // Check on mount
        checkConnection();

        // Optional: periodic check or check on online/offline events
        const handleOnline = () => checkConnection();
        const handleOffline = () => {
            setStatus("disconnected");
            setIsVisible(true);
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    if (!isVisible && status === "connected") return null;

    if (status === "disconnected") {
        return (
            <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom">
                <Alert variant="destructive">
                    <WifiOff className="h-4 w-4" />
                    <AlertTitle>Connection Lost</AlertTitle>
                    <AlertDescription className="flex flex-col gap-2">
                        <p>Could not connect to the database. Please check your internet.</p>
                        <Button variant="outline" size="sm" onClick={checkConnection} className="w-fit bg-white/10 hover:bg-white/20">
                            Retry Connection
                        </Button>
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return null;
}
