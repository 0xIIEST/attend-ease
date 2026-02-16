
export interface ClassSchedule {
  semester: number;
  branch: string;
  class_name: string;
  subject_code: string;
  classroom: string;
  time_start: string;
  time_end: string;
  day: string;
  group: 'A' | 'B' | 'ALL';
}

export type AttendanceStatus = 'present' | 'absent' | 'cancelled' | null;

export interface AttendanceRecord {
  id?: string;
  studentId: string;
  subjectCode: string;
  status: AttendanceStatus;
  classDate: string; // YYYY-MM-DD
  timeStart?: string; // HH:MM - distinguishes same subject at different time slots
  markedAt: any;
}

export interface UserProfile {
  id: string; // Firebase Auth UID
  collegeId: string; // YYYYXYZ123
  name: string;
  authEmail: string; // The email used for Firebase Auth (collegeId based)
  branch: string;
  year: string;
  rollNumber: string;
  currentSemester: number;
  group: 'A' | 'B';
}

export const BRANCH_MAP: Record<string, string> = {
  "CSB": "Computer Science",
  "EEB": "Electrical Engineering",
  "MEB": "Mechanical Engineering",
  "CEB": "Civil Engineering",
  "ITB": "Information Technology",
  "ALL": "General"
};

export function getBranchName(code: string): string {
  return BRANCH_MAP[code.toUpperCase()] || code;
}
