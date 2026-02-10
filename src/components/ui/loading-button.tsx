
import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button, ButtonProps } from "@/components/ui/button";

interface LoadingButtonProps extends ButtonProps {
    isLoading?: boolean;
}

export const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
    ({ isLoading, children, disabled, ...props }, ref) => {
        return (
            <Button
                ref={ref}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {children}
            </Button>
        );
    }
);
LoadingButton.displayName = "LoadingButton";
