import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { Schedule, ScheduleDetail, Teacher, Subject, Room, Class, TimeSlot } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import ScheduleTable from '@/components/schedule/schedule-table';
import DraggableLessonCard from '@/components/schedule/draggable-lesson';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface EditScheduleProps {
  scheduleId: number;
}

const EditSchedule: React.FC<EditScheduleProps> = ({ scheduleId }) => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  
  // Fetch schedule data
  const { data: schedule, isLoading: scheduleLoading } = useQuery<Schedule>({
    queryKey: [`/api/schedules/${scheduleId}`],
    enabled: !!scheduleId,
  });

  // Fetch schedule details
  const { data: scheduleDetails, isLoading: detailsLoading } = useQuery<ScheduleDetail[]>({
    queryKey: [`/api/schedules/${scheduleId}/details`],
    enabled: !!scheduleId,
  });

  // Fetch classes
  const { data: classes, isLoading: classesLoading } = useQuery<Class[]>({
    queryKey: ['/api/classes'],
  });

  // Fetch time slots
  const { data: timeSlots, isLoading: timeSlotsLoading } = useQuery<TimeSlot[]>({
    queryKey: ['/api/time-slots'],
  });

  // Fetch subjects
  const { data: subjects, isLoading: subjectsLoading } = useQuery<Subject[]>({
    queryKey: ['/api/subjects'],
  });

  // Fetch teachers
  const { data: teachers, isLoading: teachersLoading } = useQuery<Teacher[]>({
    queryKey: ['/api/teachers'],
  });

  // Fetch rooms
  const { data: rooms, isLoading: roomsLoading } = useQuery<Room[]>({
    queryKey: ['/api/rooms'],
  });

  // Filter assigned lessons (those already in schedule)
  const [availableLessons, setAvailableLessons] = useState<{
    subject: Subject;
    teacher: Teacher;
    room?: Room;
  }[]>([]);

  // Set first class as selected when classes are loaded
  useEffect(() => {
    if (classes && classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  // Update available lessons when selections or data changes
  useEffect(() => {
    if (!subjects || !teachers || !selectedClassId) return;

    // Get class details
    const selectedClass = classes?.find(c => c.id === selectedClassId);
    if (!selectedClass) return;

    // Potential lessons for this class (subjects assigned to this class's grade level and department)
    const potentialLessons: { subject: Subject; teacher: Teacher; room?: Room }[] = [];

    // Find subjects for this class's grade level and department
    const classSubjects = subjects.filter(
      subject => 
        (subject.gradeLevel === selectedClass.gradeLevel || !subject.gradeLevel) && 
        (!subject.departmentId || subject.departmentId === selectedClass.departmentId)
    );

    // For each subject, find eligible teachers
    classSubjects.forEach(subject => {
      // Find teachers assigned to this subject
      const eligibleTeachers = teachers.filter(teacher => 
        // In a real implementation, we would check teacher_subjects table
        // For now, assign random teachers
        true
      );

      if (eligibleTeachers.length > 0) {
        // Find appropriate rooms
        const eligibleRooms = rooms?.filter(room => room.type === subject.roomType) || [];
        
        // Add to available lessons
        eligibleTeachers.forEach(teacher => {
          potentialLessons.push({
            subject,
            teacher,
            room: eligibleRooms.length > 0 ? eligibleRooms[0] : undefined
          });
        });
      }
    });

    setAvailableLessons(potentialLessons);
  }, [subjects, teachers, rooms, selectedClassId, classes]);

  // Update schedule detail mutation
  const updateDetailMutation = useMutation({
    mutationFn: async (detail: Partial<ScheduleDetail>) => {
      const res = await apiRequest(
        "PUT", 
        `/api/schedule-details/${detail.id}`, 
        detail
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/schedules/${scheduleId}/details`] });
      toast({
        title: "Jadwal berhasil diperbarui",
        description: "Perubahan jadwal telah disimpan",
      });
    },
    onError: (error) => {
      toast({
        title: "Gagal memperbarui jadwal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create schedule detail mutation
  const createDetailMutation = useMutation({
    mutationFn: async (detail: Partial<ScheduleDetail>) => {
      const res = await apiRequest(
        "POST", 
        "/api/schedule-details", 
        detail
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/schedules/${scheduleId}/details`] });
      toast({
        title: "Jadwal berhasil diperbarui",
        description: "Pelajaran baru telah ditambahkan ke jadwal",
      });
    },
    onError: (error) => {
      toast({
        title: "Gagal menambahkan pelajaran",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete schedule detail mutation
  const deleteDetailMutation = useMutation({
    mutationFn: async (detailId: number) => {
      const res = await apiRequest(
        "DELETE", 
        `/api/schedule-details/${detailId}`, 
        undefined
      );
      return res.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/schedules/${scheduleId}/details`] });
      toast({
        title: "Pelajaran berhasil dihapus",
        description: "Pelajaran telah dihapus dari jadwal",
      });
    },
    onError: (error) => {
      toast({
        title: "Gagal menghapus pelajaran",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle drag and drop
  const handleDrop = (detail: ScheduleDetail, newTimeSlotId: number) => {
    if (detail.timeSlotId === newTimeSlotId) return;

    // Update detail with new time slot
    updateDetailMutation.mutate({
      id: detail.id,
      timeSlotId: newTimeSlotId,
      isManuallyEdited: true,
    });
  };

  // Handle lesson drop from available lessons
  const handleNewLessonDrop = (e: React.DragEvent, timeSlotId: number) => {
    e.preventDefault();
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      
      if (!data.subjectId || !data.teacherId || !selectedClassId) return;
      
      // Check if this schedule detail already exists
      const existingDetail = scheduleDetails?.find(
        d => d.classId === selectedClassId && 
             d.timeSlotId === timeSlotId
      );
      
      if (existingDetail) {
        toast({
          title: "Slot jadwal sudah terisi",
          description: "Silakan hapus pelajaran yang ada terlebih dahulu",
          variant: "destructive",
        });
        return;
      }
      
      // Create new schedule detail
      createDetailMutation.mutate({
        scheduleId,
        classId: selectedClassId,
        subjectId: data.subjectId,
        teacherId: data.teacherId,
        roomId: data.roomId || rooms?.[0]?.id, // Use default room if none specified
        timeSlotId,
        isManuallyEdited: true,
      });
    } catch (error) {
      console.error("Error parsing drag data:", error);
    }
  };

  // Loading state
  const isLoading = scheduleLoading || detailsLoading || classesLoading || 
                    timeSlotsLoading || subjectsLoading || teachersLoading || roomsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!schedule) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-10">
            <h3 className="text-lg font-medium text-gray-900">Jadwal tidak ditemukan</h3>
            <p className="mt-2 text-sm text-gray-500">Jadwal dengan ID {scheduleId} tidak ditemukan</p>
            <Button asChild className="mt-4">
              <Link href="/">
                <a>Kembali ke Dashboard</a>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="px-6 py-4 border-b border-gray-200 flex flex-wrap justify-between items-center">
          <CardTitle className="text-lg font-medium text-gray-900">
            Edit Jadwal - {schedule.name}
          </CardTitle>
          <div className="flex space-x-2">
            <Button onClick={() => navigate(`/schedule/view/${scheduleId}`)} variant="outline">
              Lihat Jadwal
            </Button>
            <Button asChild variant="outline">
              <Link href="/">
                <a>Kembali</a>
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="mb-4 flex flex-wrap gap-2">
            <div className="relative w-full sm:w-64">
              <Label htmlFor="classSelector">Pilih Kelas</Label>
              <Select
                value={selectedClassId?.toString() || ""}
                onValueChange={(value) => setSelectedClassId(parseInt(value))}
              >
                <SelectTrigger id="classSelector" className="w-full">
                  <SelectValue placeholder="Pilih Kelas" />
                </SelectTrigger>
                <SelectContent>
                  {classes?.map((classItem) => (
                    <SelectItem key={classItem.id} value={classItem.id.toString()}>
                      {classItem.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Pelajaran Tersedia:</h3>
            <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-md min-h-[100px]" id="availableLessons">
              {availableLessons.map((lesson, index) => (
                <DraggableLessonCard
                  key={`${lesson.subject.id}-${lesson.teacher.id}-${index}`}
                  subject={lesson.subject}
                  teacher={lesson.teacher}
                  room={lesson.room}
                />
              ))}
              {availableLessons.length === 0 && (
                <p className="text-gray-500 text-sm">Tidak ada pelajaran tersedia untuk kelas ini</p>
              )}
            </div>
          </div>

          {timeSlots && scheduleDetails && (
            <ScheduleTable
              scheduleDetails={scheduleDetails.filter(d => d.classId === selectedClassId)}
              timeSlots={timeSlots}
              classId={selectedClassId || undefined}
              readOnly={false}
              onDrop={handleDrop}
            />
          )}

          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Validasi & Konflik:</h3>
            <div id="validationResults" className="p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600">
                {scheduleDetails?.some(d => d.isManuallyEdited)
                  ? "Jadwal telah dimodifikasi secara manual. Beberapa aturan optimal mungkin dilanggar."
                  : "Belum ada konflik terdeteksi pada jadwal ini."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditSchedule;
