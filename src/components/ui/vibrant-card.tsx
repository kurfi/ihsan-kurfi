import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface VibrantCardProps {
    children: React.ReactNode;
    className?: string;
    variant?: "purple" | "blue" | "emerald" | "amber" | "rose" | "indigo" | "default";
    delay?: number;
}

export function VibrantCard({ children, className, variant = "default", delay = 0 }: VibrantCardProps) {
    const variantStyles = {
        default: "",
        purple: "text-vibrant-purple",
        blue: "text-vibrant-blue",
        emerald: "text-vibrant-emerald",
        amber: "text-vibrant-amber",
        rose: "text-vibrant-rose",
        indigo: "text-vibrant-indigo",
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay, ease: "easeOut" }}
            whileHover={{ y: -4, scale: 1.01 }}
            className={cn(
                "glass-card rounded-2xl p-6",
                variantStyles[variant],
                className
            )}
        >
            {variant !== "default" && (
                <div className={cn(
                    "absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full blur-3xl opacity-20 transition-opacity group-hover:opacity-30",
                    {
                        "bg-vibrant-purple": variant === "purple",
                        "bg-vibrant-blue": variant === "blue",
                        "bg-vibrant-emerald": variant === "emerald",
                        "bg-vibrant-amber": variant === "amber",
                        "bg-vibrant-rose": variant === "rose",
                        "bg-vibrant-indigo": variant === "indigo",
                    }
                )} />
            )}
            <div className="relative z-10">
                {children}
            </div>
        </motion.div>
    );
}
