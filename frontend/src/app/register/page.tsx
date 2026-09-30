"use client";
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Register() {
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post("/auth/register/", { 
        name, email, password, password_confirm: passwordConfirm 
      });
      login(res.data.access, res.data.refresh, res.data.user);
    } catch (err: any) {
      const msgs = Object.values(err.response?.data || {}).flat().join(" ");
      setError(msgs || "Registration failed");
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
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow">
        <h2 className="text-2xl font-bold text-center mb-8">Create Account</h2>
        
        {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input type="text" placeholder="Name" className="w-full p-3 border rounded-md" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <input type="email" placeholder="Email" className="w-full p-3 border rounded-md" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <input type="password" placeholder="Password" className="w-full p-3 border rounded-md" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div>
            <input type="password" placeholder="Confirm Password" className="w-full p-3 border rounded-md" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">Create Account</Button>
        </form>

        <div className="my-6 flex items-center">
          <div className="flex-1 border-t"></div>
          <span className="px-3 text-slate-400 text-sm">OR</span>
          <div className="flex-1 border-t"></div>
        </div>

        <div className="space-y-3">
          <Button onClick={handleGoogle} variant="outline" className="w-full">Continue with Google</Button>
          <Button onClick={handleGithub} variant="outline" className="w-full">Continue with GitHub</Button>
        </div>

        <p className="text-center mt-6 text-sm text-slate-500">
          Already have an account? <Link href="/login" className="text-blue-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
