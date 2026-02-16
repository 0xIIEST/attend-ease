
"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AttendanceRecord, ClassSchedule } from "@/lib/types";
import scheduleData from "@/data/schedule.json";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AttendanceStatsTable({ records }: { records: AttendanceRecord[] }) {
  // Group records by subjectCode
  const subjectStats = records.reduce((acc, curr) => {
    if (curr.subjectCode === 'BREAK') return acc;
    if (!acc[curr.subjectCode]) {
      acc[curr.subjectCode] = { present: 0, absent: 0, cancelled: 0 };
    }
    if (curr.status === 'present') acc[curr.subjectCode].present++;
    if (curr.status === 'absent') acc[curr.subjectCode].absent++;
    if (curr.status === 'cancelled') acc[curr.subjectCode].cancelled++;
    return acc;
  }, {} as Record<string, { present: number; absent: number; cancelled: number }>);

  // Map subject codes to their primary names
  const subjectMap = (scheduleData.classes as ClassSchedule[]).reduce((acc, curr) => {
    if (curr.subject_code !== 'BREAK') {
      acc[curr.subject_code] = curr.class_name;
    }
    return acc;
  }, {} as Record<string, string>);

  // Get all unique academic subject codes
  const allSubjects = Array.from(new Set(
    scheduleData.classes
      .filter(c => c.subject_code !== 'BREAK')
      .map(c => c.subject_code)
  ));

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Detailed Analysis</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Course</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Presence</TableHead>
              <TableHead className="text-right">Attendance %</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allSubjects.map(code => {
              const stat = subjectStats[code] || { present: 0, absent: 0, cancelled: 0 };
              const totalRelevant = stat.present + stat.absent;
              const percentage = totalRelevant > 0 ? (stat.present / totalRelevant) * 100 : 100;
              const name = subjectMap[code] || "Unknown Course";
              
              return (
                <TableRow key={code}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold">{name}</span>
                      <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-tighter">{code}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        P: {stat.present}
                      </Badge>
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        A: {stat.absent}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell min-w-[150px]">
                    <Progress value={percentage} className="h-1.5" />
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    <span className={percentage < 75 ? "text-destructive" : "text-primary"}>
                      {percentage.toFixed(0)}%
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
