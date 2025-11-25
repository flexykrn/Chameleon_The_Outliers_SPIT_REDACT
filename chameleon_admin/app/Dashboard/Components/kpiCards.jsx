"use client";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";


export default function KPICard({
  title,
  value,
  icon: Icon,
  trend,
  className,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25 }}
    >
      <Card
        className={`relative overflow-hidden p-6 bg-linear-to-br 
          from-card/80 to-card/40 backdrop-blur-sm border border-border 
          hover:border-accent/70 transition-all duration-300 
          shadow-md hover:shadow-yellow-400/10 ${className}`}
      >
        {/* Glow Ring */}
        <div className="absolute inset-0 opacity-0 hover:opacity-20 bg-accent/20 blur-xl transition-all duration-500"></div>

        {/* Main Content */}
        <div className="relative flex items-start justify-between z-10">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground font-medium tracking-wide">
              {title}
            </p>

            {/* Animated number */}
            <motion.p
              key={value}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="text-4xl font-extrabold tracking-tight text-foreground"
            >
              {value}
            </motion.p>

            {/* Trend pill */}
            {trend && (
              <div
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium 
                ${trend.isPositive ? "bg-green-600/20 text-green-400" : "bg-red-600/20 text-red-400"}`}
              >
                {trend.isPositive ? "▲" : "▼"} {Math.abs(trend.value)}%  
                <span className="ml-1 text-muted-foreground">since last scan</span>
              </div>
            )}
          </div>

          {/* Icon with pulse animation */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.1 }}
            className="p-3 rounded-xl bg-primary/10 border border-primary/30 shadow-inner"
          >
            <Icon className="w-7 h-7 text-primary drop-shadow-lg" />
          </motion.div>
        </div>

        {/* Bottom decorative line */}
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: "100%" }}
          transition={{ duration: 0.6 }}
          className="absolute bottom-0 left-0 h-[3px] bg-accent/60"
        ></motion.div>
      </Card>
    </motion.div>
  );
}
