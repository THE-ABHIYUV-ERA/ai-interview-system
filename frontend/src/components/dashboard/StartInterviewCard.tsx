"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import Link from "next/link";

export function StartInterviewCard() {
  return (
    <motion.div 
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className="p-8 rounded-2xl bg-gradient-to-br from-blue-900/40 to-[#111116] border border-blue-500/20 relative overflow-hidden mb-8 group"
    >
      <div className="absolute top-0 right-0 p-12 opacity-10 transform translate-x-1/3 -translate-y-1/3 group-hover:scale-110 transition-transform duration-700">
        <Play className="w-48 h-48 text-blue-500" />
      </div>
      
      <div className="relative z-10 max-w-xl">
        <h3 className="text-2xl font-semibold text-white mb-3">Ready for your next interview?</h3>
        <p className="text-white/60 mb-6 leading-relaxed">
          Practice with your AI interviewer using questions tailored to your skills and target role. The more you practice, the more confident you&apos;ll become.
        </p>
        <Link href="/dashboard/setup">
          <Button className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-[0_0_20px_rgba(37,99,235,0.2)]">
            <Play className="w-4 h-4 mr-2" fill="currentColor" />
            Start Interview
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}
