"use client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { LogOut, User, Mail, Shield } from "lucide-react";

export default function Profile() {
  const { user, logout } = useAuth();

  if (!user) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#050505] p-8 font-sans">
      <div className="max-w-3xl mx-auto mt-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 rounded-full blur-[80px] pointer-events-none" />
          
          <div className="flex items-center gap-6 mb-10">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-4xl font-bold text-white shadow-lg border-4 border-[#050505]">
                  {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                  <h1 className="text-3xl font-bold text-white mb-1">{user.name}</h1>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs text-slate-300">
                      <Shield className="w-3 h-3"/> {user.role.toUpperCase()}
                  </span>
              </div>
          </div>

          <div className="space-y-4 mb-10">
              <div className="bg-black/40 p-5 rounded-2xl border border-white/5 flex items-center gap-4">
                  <User className="w-6 h-6 text-slate-400" />
                  <div>
                      <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Full Name</div>
                      <div className="text-white font-medium">{user.name}</div>
                  </div>
              </div>
              <div className="bg-black/40 p-5 rounded-2xl border border-white/5 flex items-center gap-4">
                  <Mail className="w-6 h-6 text-slate-400" />
                  <div>
                      <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Email Address</div>
                      <div className="text-white font-medium">{user.email}</div>
                  </div>
              </div>
          </div>

          <Button onClick={logout} variant="destructive" className="w-full sm:w-auto h-12 px-8 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl gap-2 font-semibold">
              <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
