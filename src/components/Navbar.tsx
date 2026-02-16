"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, GraduationCap } from "lucide-react";
import { getBranchName } from "@/lib/types";

export function Navbar() {
  const { profile, logout } = useAuth();

  return (
    <nav className="border-b bg-white/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <div className="flex flex-col leading-none">
              <span className="font-bold text-xl tracking-tight text-primary">AttendEase</span>
              <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">IIEST Shibpur Hub</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end mr-2 text-right">
              <span className="text-sm font-semibold">{profile?.name}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {getBranchName(profile?.branch || "")} • {profile?.collegeId}
              </span>
            </div>
            <Button variant="ghost" size="icon" onClick={logout} title="Logout">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
