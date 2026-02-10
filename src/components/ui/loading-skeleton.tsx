import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
    variant?: "table" | "card" | "metric" | "list";
    rows?: number;
    className?: string;
}

export function LoadingSkeleton({ variant = "card", rows = 3, className }: LoadingSkeletonProps) {
    if (variant === "table") {
        return (
            <div className={cn("space-y-4", className)}>
                {/* Table header */}
                <div className="flex gap-4 p-4 border-b border-white/10">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-6 skeleton flex-1 rounded-lg" />
                    ))}
                </div>

                {/* Table rows */}
                {Array.from({ length: rows }).map((_, i) => (
                    <div key={i} className="flex gap-4 p-4 items-center">
                        {Array.from({ length: 5 }).map((_, j) => (
                            <div key={j} className="h-10 skeleton flex-1 rounded-xl" />
                        ))}
                    </div>
                ))}
            </div>
        );
    }

    if (variant === "metric") {
        return (
            <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6", className)}>
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="p-8 rounded-[2rem] border border-white/10 glass-card">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="h-12 w-12 rounded-2xl skeleton" />
                            <div className="h-4 w-24 skeleton" />
                        </div>
                        <div className="h-10 w-32 skeleton mb-4" />
                        <div className="h-3 w-40 skeleton rounded-full" />
                    </div>
                ))}
            </div>
        );
    }

    if (variant === "list") {
        return (
            <div className={cn("space-y-4", className)}>
                {Array.from({ length: rows }).map((_, i) => (
                    <div key={i} className="flex items-center gap-5 p-5 rounded-3xl border border-white/10 glass-card">
                        <div className="h-14 w-14 rounded-2xl skeleton flex-shrink-0" />
                        <div className="flex-1 space-y-3">
                            <div className="h-5 w-2/5 skeleton rounded-lg" />
                            <div className="h-4 w-1/4 skeleton rounded-md" />
                        </div>
                        <div className="h-8 w-20 rounded-full skeleton" />
                    </div>
                ))}
            </div>
        );
    }

    // Default: card variant
    return (
        <div className={cn("space-y-6", className)}>
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="p-8 rounded-[2.5rem] border border-white/10 glass-card space-y-5">
                    <div className="flex justify-between items-start">
                        <div className="h-8 w-1/3 skeleton rounded-xl" />
                        <div className="h-6 w-16 skeleton rounded-full" />
                    </div>
                    <div className="space-y-3">
                        <div className="h-5 w-full skeleton rounded-lg" />
                        <div className="h-5 w-5/6 skeleton rounded-lg" />
                    </div>
                    <div className="h-12 w-1/4 skeleton rounded-2xl" />
                </div>
            ))}
        </div>
    );
}

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
    return <div className={cn("skeleton", className)} />;
}
