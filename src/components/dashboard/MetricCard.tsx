import { LucideIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    positive: boolean;
  };
  variant?: "default" | "success" | "warning" | "destructive";
  className?: string;
  delay?: number;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
  className,
  delay = 0,
}: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -5, scale: 1.02 }}
      className={cn(
        "glass-card p-6 relative overflow-hidden group transition-all duration-300 rounded-3xl",
        "bg-gradient-to-br from-card/90 via-card/50 to-background/50",
        className
      )}
    >
      {/* Decorative Glow Background */}
      <div
        className={cn(
          "absolute -right-8 -top-8 w-32 h-32 rounded-full blur-3xl opacity-20 transition-all duration-500 group-hover:opacity-50 group-hover:scale-150",
          variant === "default" && "bg-vibrant-purple",
          variant === "success" && "bg-vibrant-emerald",
          variant === "warning" && "bg-vibrant-amber",
          variant === "destructive" && "bg-vibrant-rose"
        )}
      />

      <div className="relative z-10 flex flex-col h-full justify-between gap-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "p-3 rounded-2xl border border-white/20 shadow-lg backdrop-blur-xl transition-transform duration-300 group-hover:rotate-12",
                variant === "default" && "bg-vibrant-purple/10 text-vibrant-purple",
                variant === "success" && "bg-vibrant-emerald/10 text-vibrant-emerald",
                variant === "warning" && "bg-vibrant-amber/10 text-vibrant-amber",
                variant === "destructive" && "bg-vibrant-rose/10 text-vibrant-rose"
              )}
            >
              <Icon className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-muted-foreground/80 tracking-widest uppercase">{title}</h3>
          </div>

          <motion.div
            whileHover={{ rotate: 45 }}
            className="p-1.5 rounded-full bg-white/5 border border-white/10"
          >
            <ArrowUpRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-foreground transition-colors" />
          </motion.div>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <motion.h2
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="text-3xl sm:text-4xl font-black tracking-tighter text-foreground text-glow"
            >
              {value}
            </motion.h2>
          </div>

          <div className="flex items-center justify-between">
            {subtitle && (
              <p className="text-xs text-muted-foreground/70 font-bold uppercase tracking-wide">{subtitle}</p>
            )}

            {trend && (
              <motion.div
                initial={{ x: 10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: delay + 0.2 }}
                className={cn(
                  "flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full border border-white/10 shadow-sm",
                  trend.positive
                    ? "bg-vibrant-emerald/20 text-vibrant-emerald"
                    : "bg-vibrant-rose/20 text-vibrant-rose"
                )}
              >
                {trend.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {trend.value}%
              </motion.div>
            )}
          </div>
        </div>

        {/* Bottom active line decoration */}
        <div
          className={cn(
            "h-1.5 w-full rounded-full mt-2 opacity-20 group-hover:opacity-60 transition-all duration-500",
            "bg-gradient-to-r from-transparent via-current to-transparent scale-x-50 group-hover:scale-x-100",
            variant === "default" && "text-vibrant-purple",
            variant === "success" && "text-vibrant-emerald",
            variant === "warning" && "text-vibrant-amber",
            variant === "destructive" && "text-vibrant-rose"
          )}
        />
      </div>
    </motion.div>
  );
}
