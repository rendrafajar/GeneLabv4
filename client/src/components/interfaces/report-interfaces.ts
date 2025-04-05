// Interfaces untuk keperluan laporan yang meng-extend skema database

export interface ConflictDisplay {
  id: number;
  conflictType: string; // menggunakan conflictType dari skema asli
  description: string;
  scheduleId: number;
  detailId1: number;
  detailId2: number;
  severity: string;
  resourceId?: number; // field tambahan untuk tampilan (dihitung berdasarkan detail)
  timeSlotId?: number; // field tambahan untuk tampilan (dihitung berdasarkan detail)
}

export interface ScheduleDetailWithDuration extends Record<string, any> {
  id: number;
  scheduleId: number;
  classId: number;
  subjectId: number;
  teacherId: number;
  roomId: number;
  timeSlotId: number;
  isManuallyEdited: boolean | null;
  isOverride: boolean | null;
  duration: number; // field tambahan untuk keperluan laporan
}