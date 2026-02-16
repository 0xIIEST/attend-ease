
"use client";

import { ClassSchedule, AttendanceRecord, AttendanceStatus } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { format, isWithinInterval, parseISO, isSaturday, isSunday } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Clock, MapPin, Check, X, MinusCircle, Info, Coffee, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import holidaysData from "@/data/holidays.json";
import examsData from "@/data/exams.json";
// import scheduleData from "@/data/schedule.json"; // Removed static import

interface Props {
  schedule: ClassSchedule[];
  semesterConfig?: { start: string, end: string };
  selectedDate: Date;
  onCourseClick: (code: string) => void;
  attendanceRecords: { [key: string]: string | null }; // compositeKey -> status
  onAttendanceUpdate: (subjectCode: string, status: string | null, timeStart?: string) => void;
}

export function DailySchedule({ schedule, semesterConfig, selectedDate, onCourseClick, attendanceRecords, onAttendanceUpdate }: Props) {
  const { profile } = useAuth();
  const dayName = format(selectedDate, 'EEEE');
  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  // Defensive check for semesterConfig
  const isWithinSem = semesterConfig ? isWithinInterval(selectedDate, {
    start: parseISO(semesterConfig.start),
    end: parseISO(semesterConfig.end)
  }) : true; // Default to true if not provided to avoid hiding classes unexpectedly

  const holiday = holidaysData.holidays.find(h => h.date === dateStr);
  const examPeriod = examsData.periods.find(p =>
    isWithinInterval(selectedDate, {
      start: parseISO(p.start),
      end: parseISO(p.end)
    })
  );
  const isWeekend = isSaturday(selectedDate) || isSunday(selectedDate);

  // Filter out LUNCH (BREAK) and show only academic classes for the group
  // Sort classes chronologically by time_start
  const filteredClasses = (schedule || [])
    .filter(c =>
      c.day === dayName &&
      c.subject_code !== 'BREAK' && // Remove lunch from daily list
      (c.branch === profile?.branch || c.branch === 'ALL') &&
      (c.group === profile?.group || c.group === 'ALL')
    )
    .sort((a, b) => a.time_start.localeCompare(b.time_start));

  const markAttendance = (subjectCode: string, status: AttendanceStatus, timeStart?: string) => {
    onAttendanceUpdate(subjectCode, status, timeStart);
  };

  if (!isWithinSem && !holiday && !examPeriod) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
        <div className="p-4 bg-muted rounded-full">
          <Info className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-bold">Outside Semester</h3>
        <p className="text-muted-foreground">Classes are only shown for the active academic session.</p>
      </div>
    );
  }

  if (holiday) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
        <div className="p-4 bg-orange-100 rounded-full">
          <CalendarIcon className="h-8 w-8 text-orange-600" />
        </div>
        <h3 className="text-xl font-bold text-orange-800">{holiday.name}</h3>
        <Badge variant="outline" className="bg-orange-50 border-orange-200 text-orange-700">Public Holiday</Badge>
        <p className="text-muted-foreground text-sm">No regular classes today.</p>
      </div>
    );
  }

  if (examPeriod) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
        <div className="p-4 bg-blue-100 rounded-full">
          <Info className="h-8 w-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-bold text-blue-800">{examPeriod.type}</h3>
        <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">Exam Window</Badge>
        <p className="text-muted-foreground text-sm">Regular classes suspended.</p>
      </div>
    );
  }

  if (isWeekend) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
        <div className="p-4 bg-muted rounded-full">
          <Coffee className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-bold">Weekend Break</h3>
        <Badge variant="outline">Rest Day</Badge>
        <p className="text-muted-foreground text-sm">Enjoy your weekend!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          {dayName} Schedule
        </h2>
        <Badge variant="secondary" className="font-mono">{dateStr}</Badge>
      </div>

      {filteredClasses.length === 0 ? (
        <div className="text-center py-12 bg-muted/20 rounded-lg border border-dashed">
          <p className="text-muted-foreground">No academic classes scheduled.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredClasses.map((item) => {
            const compositeKey = `${item.subject_code}_${item.time_start}`;
            const currentStatus = attendanceRecords[compositeKey] || attendanceRecords[item.subject_code] || null;

            return (
              <Card key={item.subject_code + item.time_start} className={cn(
                "transition-all duration-200 border-l-4",
                currentStatus === 'present' ? "border-l-green-500 bg-green-50/20" :
                  currentStatus === 'absent' ? "border-l-red-500 bg-red-50/20" :
                    currentStatus === 'cancelled' ? "border-l-orange-500 bg-orange-50/20" :
                      "border-l-primary/30"
              )}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div
                      className="group transition-opacity cursor-pointer hover:opacity-80"
                      onClick={() => onCourseClick(item.subject_code)}
                    >
                      <h4 className="font-bold leading-none flex items-center gap-1.5 underline-offset-4 decoration-primary/30">
                        {item.class_name}
                        <ExternalLink className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 text-primary" />
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1 uppercase tracking-tight">
                        {item.subject_code} {item.group !== 'ALL' ? `• Grp ${item.group}` : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-xs font-medium">
                        <Clock className="h-3 w-3" />
                        {item.time_start} - {item.time_end}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <MapPin className="h-2.5 w-2.5" />
                        {item.classroom}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-1.5 justify-end">
                    <Button
                      size="sm"
                      variant={currentStatus === 'present' ? 'default' : 'outline'}
                      className={cn("h-8 px-2 text-[10px]", currentStatus === 'present' && "bg-green-600 hover:bg-green-700")}
                      onClick={() => markAttendance(item.subject_code, currentStatus === 'present' ? null : 'present', item.time_start)}
                    >
                      <Check className="h-3.5 w-3.5 mr-1" />
                      P
                    </Button>
                    <Button
                      size="sm"
                      variant={currentStatus === 'absent' ? 'destructive' : 'outline'}
                      className="h-8 px-2 text-[10px]"
                      onClick={() => markAttendance(item.subject_code, currentStatus === 'absent' ? null : 'absent', item.time_start)}
                    >
                      <X className="h-3.5 w-3.5 mr-1" />
                      A
                    </Button>
                    <Button
                      size="sm"
                      variant={currentStatus === 'cancelled' ? 'outline' : 'outline'}
                      className={cn("h-8 px-2 text-[10px]", currentStatus === 'cancelled' && "bg-orange-500 text-white hover:bg-orange-600")}
                      onClick={() => markAttendance(item.subject_code, currentStatus === 'cancelled' ? null : 'cancelled', item.time_start)}
                    >
                      <MinusCircle className="h-3.5 w-3.5 mr-1" />
                      C
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
