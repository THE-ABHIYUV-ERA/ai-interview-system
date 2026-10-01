"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, History } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export function WelcomeSection() {
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0] || 'Candidate';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
    >
      <div>
        <h2 className="text-2xl md:text-3xl font-semibold text-white mb-1">
          Good to see you, {firstName}
        </h2>
        <p className="text-white/50">Ready to sharpen your interview skills?</p>
      </div>
      <div className="flex items-center gap-3">
        <Link href="/dashboard/interviews">
          <Button variant="outline" className="h-10 bg-transparent border-white/10 text-white hover:bg-white/5">
            <History className="w-4 h-4 mr-2" />
            View History
          </Button>
        </Link>
        <Link href="/dashboard/setup">
          <Button className="h-10 bg-blue-600 hover:bg-blue-700 text-white">
            Start New Interview
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}
