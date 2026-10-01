"use client";
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function Register() {
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/register/", { 
        name, email, password, password_confirm: passwordConfirm 
      });
      login(res.data.access, res.data.refresh, res.data.user);
    } catch (err: any) {
      const msgs = Object.values(err.response?.data || {}).flat().join(" ");
      setError(msgs || "Registration failed");
    } finally {
        setLoading(false);
    }
  };

  const handleGoogle = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const redirect = `${window.location.origin}/auth/callback/google`;
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirect}&response_type=code&scope=email profile`;
  };

  const handleGithub = () => {
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
    const redirect = `${window.location.origin}/auth/callback/github`;
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirect}&scope=user:email`;
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050505] text-white px-4 relative overflow-hidden">
      <div className="absolute top-[20%] right-[30%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[150px] pointer-events-none" />
      
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="w-full max-w-md z-10 py-12">
        <div className="bg-white/5 backdrop-blur-xl p-10 rounded-3xl border border-white/10 shadow-2xl">
          <h2 className="text-3xl font-bold text-center mb-2">Create Account</h2>
          <p className="text-center text-slate-400 mb-8">Start your AI interview journey today.</p>
          
          {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-6 text-sm">{error}</div>}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input type="text" placeholder="Full Name" className="w-full p-4 bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-white placeholder-slate-500" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <input type="email" placeholder="Email Address" className="w-full p-4 bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-white placeholder-slate-500" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <input type="password" placeholder="Password" className="w-full p-4 bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-white placeholder-slate-500" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div>
              <input type="password" placeholder="Confirm Password" className="w-full p-4 bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-white placeholder-slate-500" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} required />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-12 bg-white text-black hover:bg-slate-200 rounded-xl font-semibold text-base transition-transform hover:scale-[1.02] mt-2">
              {loading ? "Creating..." : "Create Account"}
            </Button>
          </form>

          <div className="my-8 flex items-center gap-4">
            <div className="flex-1 border-t border-white/10"></div>
            <span className="text-slate-500 text-sm font-medium">OR CONTINUE WITH</span>
            <div className="flex-1 border-t border-white/10"></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button onClick={handleGoogle} variant="outline" className="h-12 bg-white/5 border-white/10 text-white hover:bg-white/10">
              Google
            </Button>
            <Button onClick={handleGithub} variant="outline" className="h-12 bg-white/5 border-white/10 text-white hover:bg-white/10">
              GitHub
            </Button>
          </div>

          <p className="text-center mt-8 text-sm text-slate-400">
            Already have an account? <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
