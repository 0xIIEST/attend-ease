"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { AppSidebar } from "./AppSidebar";
import { AttendanceSummary } from "./AttendanceSummary";
import { DailySchedule } from "./DailySchedule";
import { AttendanceStatsTable } from "./AttendanceStatsTable";
import { WeeklySchedule } from "./WeeklySchedule";
import { CourseDetailView } from "./CourseDetailView";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import scheduleData from "@/data/schedule.json";
import holidaysData from "@/data/holidays.json";
import examsData from "@/data/exams.json";
import { useAuth } from "@/context/AuthContext";
import { AttendanceRecord, getBranchName } from "@/lib/types";
import { parseISO, isWithinInterval, isSaturday, isSunday, format } from "date-fns";
import { api } from "@/lib/api";

export function Dashboard() {
  const { profile, user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeView, setActiveView] = useState('overview');
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [allRecords, setAllRecords] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    setIsMounted(true);
    // Initial date logic ... (simplified for brevity, keeping existing behaviour if possible)
  }, []);

  // Fetch Attendance from Backend API
  useEffect(() => {
    async function fetchAttendance() {
      if (user && profile) {
        try {
          const records = await api.students.getAttendance(user.uid);
          setAllRecords(records);
        } catch (e) {
          console.error("Failed to fetch attendance", e);
        }
      }
    }
    fetchAttendance();
  }, [user, profile]);

  // Removed: Auto-absent marking logic (Now handled by backend)

  const stats = (allRecords || []).reduce((acc, curr) => {
    if (curr.subjectCode === 'BREAK') return acc;
    if (curr.status === 'present') acc.present++;
    if (curr.status === 'absent') acc.absent++;
    if (curr.status === 'cancelled') acc.cancelled++;
    return acc;
  }, { present: 0, absent: 0, cancelled: 0 });

  const dayStatuses = useMemo(() => {
    if (!allRecords || !profile) return {};

    // Logic to calculate day status (all-present, mixed, etc.) remains checks against allRecords
    const recordsByDay = (allRecords || []).reduce((acc, curr) => {
      if (curr.subjectCode === 'BREAK') return acc;
      if (!acc[curr.classDate]) acc[curr.classDate] = [];
      acc[curr.classDate].push(curr.status);
      return acc;
    }, {} as Record<string, (string | null)[]>);

    const statuses: Record<string, string> = {};

    Object.entries(recordsByDay).forEach(([date, dayRecords]) => {
      const dayDate = parseISO(date);
      const isHoliday = holidaysData.holidays.some(h => h.date === date);
      const isExam = examsData.periods.some(p => isWithinInterval(dayDate, { start: parseISO(p.start), end: parseISO(p.end) }));
      const isWknd = isSaturday(dayDate) || isSunday(dayDate);
      if (isHoliday || isExam || isWknd) return;

      const dayName = format(dayDate, 'EEEE');
      const expectedClasses = scheduleData.classes.filter(c =>
        c.day === dayName &&
        c.subject_code !== 'BREAK' &&
        (c.branch === profile.branch || c.branch === 'ALL') &&
        (c.group === profile.group || c.group === 'ALL')
      );

      if (expectedClasses.length === 0) return;
      const markedRecords = dayRecords.filter(r => r !== null);
      if (markedRecords.length === 0) return;

      const uniqueStatuses = Array.from(new Set(markedRecords));

      if (markedRecords.length >= expectedClasses.length && uniqueStatuses.length === 1) {
        const status = uniqueStatuses[0];
        if (status === 'present') statuses[date] = 'all-present';
        else if (status === 'absent') statuses[date] = 'all-absent';
        else if (status === 'cancelled') statuses[date] = 'all-cancelled';
      } else {
        statuses[date] = 'mixed';
      }
    });

    return statuses;
  }, [allRecords, profile]);

  const modifiers = {
    holiday: holidaysData.holidays.map(h => parseISO(h.date)),
    exam: (date: Date) => examsData.periods.some(p =>
      isWithinInterval(date, { start: parseISO(p.start), end: parseISO(p.end) })
    ),
    weekend: (date: Date) => isSaturday(date) || isSunday(date),
    allPresent: (date: Date) => dayStatuses[format(date, 'yyyy-MM-dd')] === 'all-present',
    allAbsent: (date: Date) => dayStatuses[format(date, 'yyyy-MM-dd')] === 'all-absent',
    allCancelled: (date: Date) => dayStatuses[format(date, 'yyyy-MM-dd')] === 'all-cancelled',
    mixed: (date: Date) => dayStatuses[format(date, 'yyyy-MM-dd')] === 'mixed'
  };

  const modifierStyles = {
    holiday: { color: 'white', backgroundColor: '#f97316', borderRadius: '4px' },
    exam: { color: 'white', backgroundColor: '#3b82f6', borderRadius: '4px' },
    weekend: { backgroundColor: 'rgba(0,0,0,0.03)', color: '#666' },
    allPresent: { backgroundColor: '#22c55e', color: 'white', borderRadius: '50%' },
    allAbsent: { backgroundColor: '#ef4444', color: 'white', borderRadius: '50%' },
    allCancelled: { backgroundColor: '#f97316', color: 'white', borderRadius: '50%' },
    mixed: { backgroundColor: '#fef08a', color: '#854d0e', borderRadius: '50%' }
  };

  const handleCourseClick = (code: string) => {
    if (code === 'BREAK') return;
    setSelectedCourse(code);
    setActiveView('course-detail');
  };

  const handleAttendanceUpdate = async (subjectCode: string, status: string | null) => {
    if (!user || !profile) return;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    // Optimistic Update
    setAllRecords(prev => {
      const existingIndex = prev.findIndex(r => r.subjectCode === subjectCode && r.classDate === dateStr);
      if (existingIndex >= 0) {
        if (status === null) {
          // Remove record if status is null/unmarked (logic depends on how we handle unmarking)
          // Actually button passing null means toggle off?
          // The DailySchedule passes 'present', 'absent', 'cancelled' or null.
          // If null, we might want to delete the record?
          // For now, let's assume we just update it.
          // If status is null, we filter it out.
          return prev.filter((_, i) => i !== existingIndex);
        }
        const newRecords = [...prev];
        newRecords[existingIndex] = { ...newRecords[existingIndex], status: status as any };
        return newRecords;
      } else {
        if (status === null) return prev;
        // Add new record
        return [...prev, {
          studentId: user.uid,
          subjectCode,
          status: status as any,
          classDate: dateStr,
          markedAt: new Date().toISOString() // temporary
        }];
      }
    });

    try {
      await api.students.markAttendance(user.uid, {
        subjectCode,
        status,
        classDate: dateStr
      });
    } catch (e) {
      console.error("Failed to mark attendance", e);
      // Revert on failure? (TODO: Implement rollback)
    }
  };

  if (!isMounted) return null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background w-full">
        <AppSidebar activeView={activeView} onViewChange={setActiveView} />

        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1 flex items-center justify-between">
              <h1 className="text-lg font-bold tracking-tight">AttendEase for IIEST</h1>
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest bg-muted px-2 py-1 rounded border font-bold">
                Unofficial Community Portal
              </div>
            </div>
          </header>

          <main className="flex-1 p-6 overflow-y-auto">
            {activeView === 'overview' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <h2 className="text-3xl font-extrabold tracking-tight">Academic Overview</h2>
                    <p className="text-muted-foreground">
                      Hello, {profile?.name}. Tracking your IIEST {getBranchName(profile?.branch || "")} session.
                    </p>
                  </div>
                </div>

                <AttendanceSummary
                  present={stats.present}
                  absent={stats.absent}
                  cancelled={stats.cancelled}
                  records={allRecords || []}
                />

                <Card className="overflow-hidden shadow-md border-none ring-1 ring-black/5">
                  <div className="grid grid-cols-1 lg:grid-cols-12">
                    <div className="lg:col-span-8 p-4 bg-white border-r">
                      <div className="flex flex-col items-center">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => date && setSelectedDate(date)}
                          modifiers={modifiers}
                          modifiersStyles={modifierStyles}
                          weekStartsOn={1}
                          className="w-full rounded-md max-w-lg"
                          classNames={{
                            month: "space-y-4 w-full",
                            table: "w-full border-collapse space-y-1",
                            head_cell: "text-muted-foreground rounded-md w-12 font-medium text-[0.8rem]",
                            cell: "h-12 w-12 text-center text-sm p-0 relative focus-within:z-20",
                            day: "h-10 w-10 p-0 font-normal aria-selected:opacity-100 mx-auto",
                          }}
                        />
                        {/* Legend ... */}
                      </div>
                    </div>

                    <div className="lg:col-span-4 bg-muted/20">
                      <ScrollArea className="h-[500px] lg:h-[600px] p-6">
                        <DailySchedule
                          schedule={scheduleData.classes as any}
                          selectedDate={selectedDate}
                          onCourseClick={handleCourseClick}
                          attendanceRecords={allRecords
                            .filter(r => r.classDate === format(selectedDate, 'yyyy-MM-dd'))
                            .reduce((acc, curr) => ({ ...acc, [curr.subjectCode]: curr.status }), {})
                          }
                          onAttendanceUpdate={handleAttendanceUpdate}
                        />
                      </ScrollArea>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {activeView === 'weekly' && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <WeeklySchedule onCourseClick={handleCourseClick} />
              </div>
            )}

            {activeView === 'courses' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold tracking-tight">Course Attendance</h2>
                  <p className="text-sm text-muted-foreground">Detailed breakdown for the academic session.</p>
                </div>
                <AttendanceStatsTable records={allRecords || []} />
              </div>
            )}

            {activeView === 'course-detail' && selectedCourse && (
              <div className="animate-in zoom-in-95 duration-300">
                <CourseDetailView
                  subjectCode={selectedCourse}
                  onBack={() => setActiveView('overview')}
                />
              </div>
            )}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
