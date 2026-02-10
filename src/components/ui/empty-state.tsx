import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    className?: string;
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    className,
}: EmptyStateProps) {
    return (
        <div className={cn(
            "flex flex-col items-center justify-center py-12 px-4 text-center animate-fade-in",
            className
        )}>
            {Icon && (
                <div className="mb-4 p-4 rounded-full bg-muted/50">
                    <Icon className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
                </div>
            )}

            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
                {title}
            </h3>

            {description && (
                <p className="text-sm text-muted-foreground max-w-md mb-6">
                    {description}
                </p>
            )}

            {action && (
                <Button onClick={action.onClick} className="gradient-primary">
                    {action.label}
                </Button>
            )}
        </div>
    );
}
