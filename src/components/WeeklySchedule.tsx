
"use client";

import { useAuth } from "@/context/AuthContext";
import { ClassSchedule, getBranchName } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const START_HOUR = 9;
const END_HOUR = 17; // Up to 5:00 PM
const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60;

function timeToMinutes(timeStr: string) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours * 60 + minutes) - (START_HOUR * 60);
}

interface WeeklyScheduleProps {
  schedule: ClassSchedule[];
  onCourseClick: (code: string) => void;
}

export function WeeklySchedule({ schedule, onCourseClick }: WeeklyScheduleProps) {
  const { profile } = useAuth();

  if (!profile) return null;

  const filteredClasses = (schedule || []).filter(c =>
    (c.branch === profile.branch || c.branch === 'ALL') &&
    (c.group === profile.group || c.group === 'ALL')
  );

  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

  return (
    <Card className="shadow-md border-none ring-1 ring-black/5 overflow-hidden">
      <CardHeader className="bg-white border-b sticky top-0 z-20">
        <CardTitle>Weekly Timetable</CardTitle>
        <p className="text-sm text-muted-foreground">
          {getBranchName(profile.branch)} • Group {profile.group}
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-250px)]">
          <div className="min-w-[800px] p-6">
            <div className="grid grid-cols-[80px_repeat(5,1fr)] relative">
              {/* Top Header Days */}
              <div className="h-10 border-b"></div>
              {DAYS.map(day => (
                <div key={day} className="h-10 border-b border-l flex items-center justify-center font-bold text-xs uppercase tracking-widest text-muted-foreground">
                  {day}
                </div>
              ))}

              {/* Time Column & Grid Rows */}
              <div className="relative" style={{ height: `${TOTAL_MINUTES}px` }}>
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="absolute w-full flex items-center pr-2 border-t text-[10px] text-muted-foreground font-mono"
                    style={{ top: `${(hour - START_HOUR) * 60}px`, height: '60px' }}
                  >
                    {hour.toString().padStart(2, '0')}:00
                  </div>
                ))}
              </div>

              {/* Main Content Grid */}
              {DAYS.map((day, dayIndex) => (
                <div
                  key={day}
                  className="relative border-l border-r last:border-r-0"
                  style={{ height: `${TOTAL_MINUTES}px` }}
                >
                  {/* Grid background lines */}
                  {hours.map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-full border-t border-muted/20"
                      style={{ top: `${i * 60}px`, height: '60px' }}
                    />
                  ))}

                  {/* Class Blobs */}
                  {filteredClasses
                    .filter(c => c.day === day)
                    .map((cls, i) => {
                      const startMins = timeToMinutes(cls.time_start);
                      const endMins = timeToMinutes(cls.time_end);
                      const duration = endMins - startMins;
                      const isBreak = cls.subject_code === 'BREAK';

                      return (
                        <div
                          key={i}
                          onClick={() => !isBreak && onCourseClick(cls.subject_code)}
                          className={cn(
                            "absolute left-1 right-1 rounded-md p-2 border flex flex-col justify-between transition-all group overflow-hidden",
                            isBreak
                              ? "bg-muted/40 border-muted text-muted-foreground"
                              : "bg-primary/10 border-primary/20 hover:bg-primary/20 cursor-pointer shadow-sm"
                          )}
                          style={{
                            top: `${startMins}px`,
                            height: `${duration}px`,
                          }}
                        >
                          <div>
                            <p className={cn(
                              "text-[10px] font-bold leading-tight truncate",
                              isBreak ? "text-muted-foreground" : "text-primary"
                            )}>
                              {cls.class_name}
                            </p>
                            {!isBreak && (
                              <p className="text-[9px] text-muted-foreground font-mono mt-0.5">
                                {cls.subject_code}
                              </p>
                            )}
                          </div>

                          <div className="flex justify-between items-end">
                            <span className="text-[8px] opacity-70 font-mono">
                              {cls.time_start} - {cls.time_end}
                            </span>
                            {!isBreak && (
                              <span className="text-[9px] font-bold bg-white/50 px-1 rounded border border-black/5">
                                {cls.classroom}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
