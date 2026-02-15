"use client";

import { Calendar, LayoutDashboard, Table2, BookOpen, LogOut, GraduationCap, ChevronRight } from "lucide-react";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent
} from "@/components/ui/sidebar";
import { useAuth } from "@/context/AuthContext";
import { getBranchName } from "@/lib/types";

interface Props {
  activeView: string;
  onViewChange: (view: string) => void;
}

export function AppSidebar({ activeView, onViewChange }: Props) {
  const { profile, logout } = useAuth();

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="h-16 flex items-center px-4 border-b">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-primary rounded-lg text-white">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="font-bold text-sm tracking-tight">AttendEase</span>
            <span className="text-[10px] text-muted-foreground uppercase font-mono leading-none">IIEST Shibpur Hub</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={activeView === 'overview'} 
                  onClick={() => onViewChange('overview')}
                  tooltip="Dashboard Overview"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Daily Overview</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={activeView === 'weekly'} 
                  onClick={() => onViewChange('weekly')}
                  tooltip="Weekly Timetable"
                >
                  <Table2 className="h-4 w-4" />
                  <span>Weekly Schedule</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={activeView === 'courses'} 
                  onClick={() => onViewChange('courses')}
                  tooltip="Course Breakdown"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Course Attendance</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto border-t pt-4">
          <div className="px-2 py-4 group-data-[collapsible=icon]:hidden">
            <div className="p-3 bg-muted/50 rounded-xl border border-dashed text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">IIEST Session 2026</p>
              <p className="text-xs mt-1">Semester {profile?.currentSemester} • Unofficial</p>
            </div>
          </div>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-3 px-2 py-2 mb-2 group-data-[collapsible=icon]:hidden">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase">
                {profile?.name.charAt(0)}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-semibold truncate leading-none mb-1">{profile?.name}</span>
                <span className="text-[10px] text-muted-foreground truncate uppercase font-mono">{getBranchName(profile?.branch || "")}</span>
              </div>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={logout} className="text-destructive hover:text-destructive hover:bg-destructive/10">
              <LogOut className="h-4 w-4" />
              <span>Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
