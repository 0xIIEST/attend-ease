
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, Ban, TrendingUp, AlertTriangle } from "lucide-react";
import { AttendanceRecord } from "@/lib/types";
import scheduleData from "@/data/schedule.json";

interface StatsProps {
  present: number;
  absent: number;
  cancelled: number;
  records: AttendanceRecord[];
}

export function AttendanceSummary({ present, absent, cancelled, records }: StatsProps) {
  const totalRelevant = present + absent;
  const percentage = totalRelevant > 0 ? (present / totalRelevant) * 100 : 100;

  // Map subject codes to names for the alerts
  const subjectMap = (scheduleData.classes as any[]).reduce((acc, curr) => {
    if (curr.subject_code !== 'BREAK') {
      acc[curr.subject_code] = curr.class_name;
    }
    return acc;
  }, {} as Record<string, string>);

  // Calculate subject-wise stats for alerts, excluding BREAK
  const subjectStats = records.reduce((acc, curr) => {
    if (curr.subjectCode === 'BREAK') return acc;
    if (!acc[curr.subjectCode]) acc[curr.subjectCode] = { p: 0, a: 0 };
    if (curr.status === 'present') acc[curr.subjectCode].p++;
    if (curr.status === 'absent') acc[curr.subjectCode].a++;
    return acc;
  }, {} as Record<string, { p: number, a: number }>);

  const alerts = Object.entries(subjectStats)
    .map(([code, stat]) => {
      const total = stat.p + stat.a;
      const pct = total > 0 ? (stat.p / total) * 100 : 100;
      return { code, pct, name: subjectMap[code] || code };
    })
    .filter(a => a.pct < 75)
    .sort((a, b) => a.pct - b.pct);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-primary/10 overflow-hidden lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Attendance</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{percentage.toFixed(1)}%</div>
            <Progress value={percentage} className="h-2 mt-2" />
            
            {alerts.length > 0 && (
              <div className="mt-4 pt-3 border-t space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-yellow-600" /> Attendance Alerts
                </p>
                <div className="flex flex-col gap-2">
                  {alerts.map(alert => (
                    <div 
                      key={alert.code} 
                      className={`text-[10px] font-bold px-3 py-2 rounded border flex flex-col gap-0.5 ${
                        alert.pct < 50 
                        ? "bg-red-50 text-red-700 border-red-100" 
                        : "bg-yellow-50 text-yellow-700 border-yellow-100"
                      }`}
                    >
                      <span className="uppercase tracking-tight">
                        {alert.pct < 50 ? "Critical" : "Warning"}
                      </span>
                      <span className="text-sm font-bold truncate">
                        {alert.name} &lt; {alert.pct < 50 ? "50%" : "75%"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <p className="text-[10px] text-muted-foreground mt-3 italic">
              * Target: 75% eligibility
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-green-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{present}</div>
            <p className="text-xs text-muted-foreground mt-1">Classes attended</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-red-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{absent}</div>
            <p className="text-xs text-muted-foreground mt-1">Classes missed</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-orange-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
            <Ban className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{cancelled}</div>
            <p className="text-xs text-muted-foreground mt-1">Faculty cancelled</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
