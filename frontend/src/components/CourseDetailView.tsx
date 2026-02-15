"use client";

import { useAuth } from "@/context/AuthContext";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { AttendanceRecord, ClassSchedule } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { collection, query, where } from "firebase/firestore";
import { ArrowLeft, Clock, MapPin, Calendar, Info } from "lucide-react";
import scheduleData from "@/data/schedule.json";

interface Props {
  subjectCode: string;
  onBack: () => void;
}

export function CourseDetailView({ subjectCode, onBack }: Props) {
  const { profile } = useAuth();
  const db = useFirestore();

  const courseRecordsQuery = useMemoFirebase(() => {
    if (!db || !profile) return null;
    return query(
      collection(db, 'studentProfiles', profile.id, 'attendanceRecords'),
      where("subjectCode", "==", subjectCode)
    );
  }, [db, profile, subjectCode]);

  const { data: records, isLoading } = useCollection<AttendanceRecord>(courseRecordsQuery);

  const courseDetails = (scheduleData.classes as ClassSchedule[]).find(c => c.subject_code === subjectCode);
  const courseSchedule = (scheduleData.classes as ClassSchedule[]).filter(c => c.subject_code === subjectCode && 
    (c.group === profile?.group || c.group === 'ALL')
  );

  const stats = (records || []).reduce((acc, curr) => {
    if (curr.status === 'present') acc.present++;
    if (curr.status === 'absent') acc.absent++;
    if (curr.status === 'cancelled') acc.cancelled++;
    return acc;
  }, { present: 0, absent: 0, cancelled: 0 });

  const totalRelevant = stats.present + stats.absent;
  const percentage = totalRelevant > 0 ? (stats.present / totalRelevant) * 100 : 100;

  if (!courseDetails) return <div>Course not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{courseDetails.class_name}</h1>
          <p className="text-sm text-muted-foreground uppercase font-mono tracking-widest">{subjectCode}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-4 space-y-6">
          <Card className="shadow-sm border-primary/20 bg-primary/[0.02]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Attendance Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-extrabold text-primary mb-2">
                {percentage.toFixed(1)}%
              </div>
              <Progress value={percentage} className="h-2 mb-4" />
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white p-2 rounded border flex flex-col">
                  <span className="text-muted-foreground">Present</span>
                  <span className="font-bold text-green-600">{stats.present}</span>
                </div>
                <div className="bg-white p-2 rounded border flex flex-col">
                  <span className="text-muted-foreground">Absent</span>
                  <span className="font-bold text-red-600">{stats.absent}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Class Logistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs font-semibold">Primary Venue</p>
                  <p className="text-xs text-muted-foreground">{courseDetails.classroom}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Info className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs font-semibold">Branch Context</p>
                  <p className="text-xs text-muted-foreground">{courseDetails.branch}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-8">
          <Card className="shadow-sm h-full">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" /> Weekly Slots
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {courseSchedule.map((slot, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-muted">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-white rounded-md border text-center min-w-[60px]">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">{slot.day.substring(0, 3)}</p>
                      </div>
                      <div>
                        <p className="font-bold text-sm">{slot.day}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Clock className="h-3 w-3" /> {slot.time_start} - {slot.time_end}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="font-mono text-[10px]">{slot.classroom}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
