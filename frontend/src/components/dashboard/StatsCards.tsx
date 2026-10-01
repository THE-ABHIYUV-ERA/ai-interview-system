"use client";

import { motion } from "framer-motion";
import { Mic, Target, Trophy, Clock } from "lucide-react";
import { DashboardStats } from "@/types/dashboard";

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const cardVariant = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

export function StatsCards({ stats }: { stats: DashboardStats }) {
  const cards = [
    {
      label: "Total Interviews",
      value: stats.totalInterviews !== null ? stats.totalInterviews : "--",
      icon: Mic,
      color: "text-blue-400",
      bg: "bg-blue-500/10"
    },
    {
      label: "Average Score",
      value: stats.averageScore !== null ? `${stats.averageScore}%` : "--",
      icon: Target,
      color: "text-violet-400",
      bg: "bg-violet-500/10"
    },
    {
      label: "Best Score",
      value: stats.bestScore !== null ? `${stats.bestScore}%` : "--",
      icon: Trophy,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10"
    },
    {
      label: "Practice Hours",
      value: stats.practiceHours !== null ? `${stats.practiceHours}h` : "--",
      icon: Clock,
      color: "text-amber-400",
      bg: "bg-amber-500/10"
    }
  ];

  return (
    <motion.div 
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
    >
      {cards.map((card, i) => (
        <motion.div 
          key={i} 
          variants={cardVariant}
          className="p-5 rounded-xl bg-[#111116] border border-white/5 flex flex-col justify-between"
        >
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-medium text-white/50">{card.label}</span>
            <div className={`p-2 rounded-lg ${card.bg}`}>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
          </div>
          <div className="text-3xl font-semibold text-white">
            {card.value}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
