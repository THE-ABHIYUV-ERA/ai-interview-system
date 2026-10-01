"use client";

import { Bell, Menu, Settings } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";

export function Topbar({ setMobileOpen }: { setMobileOpen: (open: boolean) => void }) {
  const pathname = usePathname();
  const { user } = useAuth();
  
  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Dashboard';
    const parts = pathname?.split('/') || [];
    if (parts.length > 2) {
      return parts[2].charAt(0).toUpperCase() + parts[2].slice(1);
    }
    return 'Dashboard';
  };

  return (
    <header className="h-16 border-b border-white/5 bg-[#050508]/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setMobileOpen(true)}
          className="md:hidden text-white/70 hover:text-white"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-medium text-white">{getPageTitle()}</h1>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.02] border border-white/5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-medium text-white/60">AI System Online</span>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="text-white/50 hover:text-white transition-colors relative">
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />
          </button>
        </div>
      </div>
    </header>
  );
}
