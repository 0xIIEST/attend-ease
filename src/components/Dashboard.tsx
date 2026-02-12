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
import { useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking } from "@/firebase";
import { useAuth } from "@/context/AuthContext";
import { AttendanceRecord, getBranchName } from "@/lib/types";
import { collection, query, doc, serverTimestamp } from "firebase/firestore";
import { parseISO, isWithinInterval, isSaturday, isSunday, format, addDays, isBefore, startOfDay, subDays, isAfter } from "date-fns";

export function Dashboard() {
  const { profile } = useAuth();
  const db = useFirestore();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeView, setActiveView] = useState('overview');
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const hasProcessedAutoAbsent = useRef(false);

  useEffect(() => {
    setIsMounted(true);
    const today = new Date();
    const semStart = parseISO(scheduleData.semesterConfig.start);
    const semEnd = parseISO(scheduleData.semesterConfig.end);
    
    if (isBefore(today, semStart)) {
      setSelectedDate(semStart);
    } else if (isAfter(today, semEnd)) {
      setSelectedDate(semEnd);
    } else {
      setSelectedDate(today);
    }
  }, []);

  const allRecordsQuery = useMemoFirebase(() => {
    if (!db || !profile) return null;
    return query(collection(db, 'studentProfiles', profile.id, 'attendanceRecords'));
  }, [db, profile]);

  const { data: allRecords } = useCollection<AttendanceRecord>(allRecordsQuery);

  // Background task to mark past classes as absent - optimized for Blaze cost
  useEffect(() => {
    if (!allRecords || !profile || !db || !isMounted || hasProcessedAutoAbsent.current) return;

    const today = startOfDay(new Date());
    const semStart = parseISO(scheduleData.semesterConfig.start);
    const yesterday = subDays(today, 1);

    if (isBefore(yesterday, semStart)) return;

    const existingRecords = new Set((allRecords || []).map(r => `${r.subjectCode}_${r.classDate}`));
    let currentDate = semStart;
    let writesCount = 0;

    while (isBefore(currentDate, today)) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const dayName = format(currentDate, 'EEEE');
      
      const isHoliday = holidaysData.holidays.some(h => h.date === dateStr);
      const isExam = examsData.periods.some(p => isWithinInterval(currentDate, { start: parseISO(p.start), end: parseISO(p.end) }));
      const isWknd = isSaturday(currentDate) || isSunday(currentDate);

      if (!isHoliday && !isExam && !isWknd) {
        const expected = scheduleData.classes.filter(c => 
          c.day === dayName && 
          c.subject_code !== 'BREAK' && 
          (c.branch === profile.branch || c.branch === 'ALL') &&
          (c.group === profile.group || c.group === 'ALL')
        );

        expected.forEach(cls => {
          const key = `${cls.subject_code}_${dateStr}`;
          if (!existingRecords.has(key)) {
            const recordRef = doc(db, 'studentProfiles', profile.id, 'attendanceRecords', key);
            setDocumentNonBlocking(recordRef, {
              studentId: profile.id,
              subjectCode: cls.subject_code,
              status: 'absent',
              classDate: dateStr,
              markedAt: serverTimestamp()
            }, { merge: true });
            writesCount++;
          }
        });
      }
      currentDate = addDays(currentDate, 1);
    }
    
    // Only set the flag if we've actually checked the whole history once
    if (writesCount >= 0) {
      hasProcessedAutoAbsent.current = true;
    }
  }, [allRecords, profile, db, isMounted]);

  const stats = (allRecords || []).reduce((acc, curr) => {
    if (curr.subjectCode === 'BREAK') return acc;
    if (curr.status === 'present') acc.present++;
    if (curr.status === 'absent') acc.absent++;
    if (curr.status === 'cancelled') acc.cancelled++;
    return acc;
  }, { present: 0, absent: 0, cancelled: 0 });

  const dayStatuses = useMemo(() => {
    if (!allRecords || !profile) return {};
    
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
                        <div className="mt-6 flex flex-wrap gap-4 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded bg-green-500" />
                            <span>All Present</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded bg-red-500" />
                            <span>All Absent</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded bg-orange-500" />
                            <span>Cancelled</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded bg-yellow-400" />
                            <span>Mixed</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded bg-blue-500" />
                            <span>Exams</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-4 bg-muted/20">
                      <ScrollArea className="h-[500px] lg:h-[600px] p-6">
                        <DailySchedule 
                          schedule={scheduleData.classes as any} 
                          selectedDate={selectedDate} 
                          onCourseClick={handleCourseClick}
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
