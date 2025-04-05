import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { AlertCircle, AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Class, 
  Department, 
  Room, 
  Schedule, 
  ScheduleConflict, 
  ScheduleDetail, 
  Subject, 
  Teacher, 
  TimeSlot 
} from '@shared/schema';

// Helper function to convert dayOfWeek number to day name in Indonesian
function getDayName(dayOfWeek: number): string {
  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
  return days[dayOfWeek - 1] || `Hari ${dayOfWeek}`;
}

// Tipe data untuk solusi konflik
interface ConflictSolution {
  id: string;
  description: string;
  action: 'changeRoom' | 'changeTime' | 'changeTeacher' | 'removeLesson';
  newValue?: number; // ID dari room, time, atau teacher baru
}

// Tipe data untuk konflik dengan data yang sudah di-resolve
interface ConflictWithDetails extends ScheduleConflict {
  details?: {
    conflictingLessons: ScheduleDetailWithRelations[];
    possibleSolutions: ConflictSolution[];
  }
  selectedSolution?: ConflictSolution;
  // Helper properties untuk memudahkan akses
  type: string; // Alias untuk conflictType
  resourceId: number; // ID dari resource yang konflik (teacher atau room)
  timeSlotId: number; // Time slot yang mengalami konflik
}

// Tipe data untuk detail jadwal dengan relasi
interface ScheduleDetailWithRelations extends ScheduleDetail {
  class?: Class;
  subject?: Subject;
  teacher?: Teacher;
  room?: Room;
  timeSlot?: TimeSlot;
}

interface ConflictResolutionWizardProps {
  isOpen: boolean;
  onClose: () => void;
  scheduleId: number;
}

const ConflictResolutionWizard: React.FC<ConflictResolutionWizardProps> = ({
  isOpen,
  onClose,
  scheduleId
}) => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [conflicts, setConflicts] = useState<ConflictWithDetails[]>([]);
  const [currentConflictIndex, setCurrentConflictIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isResolutionComplete, setIsResolutionComplete] = useState(false);
  const [selectedScheduleDetail, setSelectedScheduleDetail] = useState<ScheduleDetailWithRelations | null>(null);

  // Fetch conflicts
  const { data: conflictsData, isLoading: isLoadingConflicts, refetch: refetchConflicts } = useQuery<ScheduleConflict[]>({
    queryKey: ['/api/schedule-conflicts', scheduleId],
    queryFn: async () => {
      const response = await fetch(`/api/schedule-conflicts/${scheduleId}`);
      if (!response.ok) {
        throw new Error('Gagal mengambil data konflik jadwal');
      }
      return response.json();
    },
    enabled: isOpen,
  });

  // Fetch schedule details
  const { data: scheduleDetails, isLoading: isLoadingDetails } = useQuery<ScheduleDetailWithRelations[]>({
    queryKey: ['/api/schedule-details', scheduleId],
    queryFn: async () => {
      const response = await fetch(`/api/schedule-details/${scheduleId}`);
      if (!response.ok) {
        throw new Error('Gagal mengambil data detail jadwal');
      }
      return response.json();
    },
    enabled: isOpen,
  });

  // Fetch rooms for alternative options
  const { data: rooms } = useQuery<Room[]>({
    queryKey: ['/api/rooms'],
    enabled: isOpen,
  });

  // Fetch time slots for alternative options
  const { data: timeSlots } = useQuery<TimeSlot[]>({
    queryKey: ['/api/time-slots'],
    enabled: isOpen,
  });

  // Fetch teachers for alternative options
  const { data: teachers } = useQuery<Teacher[]>({
    queryKey: ['/api/teachers'],
    enabled: isOpen,
  });

  // Mutation for applying a solution
  const applySolutionMutation = useMutation({
    mutationFn: async ({ 
      detailId, 
      action, 
      newValue 
    }: { 
      detailId: number; 
      action: string; 
      newValue?: number 
    }) => {
      return await apiRequest('PUT', `/api/schedule-details/${detailId}/resolve-conflict`, {
        action,
        newValue
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/schedule-details', scheduleId] });
      queryClient.invalidateQueries({ queryKey: ['/api/schedule-conflicts', scheduleId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Gagal menerapkan solusi',
        description: error.message || 'Terjadi kesalahan saat menerapkan solusi',
        variant: 'destructive',
      });
    }
  });

  // Update conflicts with details when data is loaded
  useEffect(() => {
    if (conflictsData && scheduleDetails) {
      const enhancedConflicts = conflictsData.map(conflict => {
        // Find conflicting lessons
        const conflictingLessons = scheduleDetails.filter(detail => 
          // We're selecting all details with the same IDs as found in conflict
          detail.id === conflict.detailId1 || detail.id === conflict.detailId2
        );

        // Generate possible solutions
        const possibleSolutions: ConflictSolution[] = [];
        
        // Add room change solutions
        if (conflict.type === 'ROOM_CONFLICT' && rooms) {
          // Filter available rooms (not used in this time slot)
          const usedRoomIds = scheduleDetails
            .filter(d => d.timeSlotId === conflict.timeSlotId)
            .map(d => d.roomId);
          
          const availableRooms = rooms.filter(r => !usedRoomIds.includes(r.id));
          
          // Add room change solutions for each conflicting lesson
          conflictingLessons.forEach(lesson => {
            const subjectRoomType = lesson.subject?.roomType || 'teori';
            const suitableRooms = availableRooms.filter(r => r.type === subjectRoomType);
            
            suitableRooms.forEach(room => {
              possibleSolutions.push({
                id: `room-${lesson.id}-${room.id}`,
                description: `Pindahkan "${lesson.subject?.name}" ke ruangan ${room.name}`,
                action: 'changeRoom',
                newValue: room.id
              });
            });
          });
        }
        
        // Add time change solutions
        if (timeSlots) {
          // For each conflicting lesson, add time change options
          conflictingLessons.forEach(lesson => {
            // Find teacher availability
            const teacherAvailableTimeSlots = timeSlots.filter(ts => {
              // Check if teacher is already scheduled at this time
              const teacherBusy = scheduleDetails.some(d => 
                d.teacherId === lesson.teacherId && 
                d.timeSlotId === ts.id &&
                d.id !== lesson.id
              );
              
              // Check if room is already scheduled at this time
              const roomBusy = scheduleDetails.some(d => 
                d.roomId === lesson.roomId && 
                d.timeSlotId === ts.id &&
                d.id !== lesson.id
              );
              
              return !teacherBusy && !roomBusy;
            });
            
            teacherAvailableTimeSlots.forEach(ts => {
              possibleSolutions.push({
                id: `time-${lesson.id}-${ts.id}`,
                description: `Pindahkan "${lesson.subject?.name}" ke waktu ${getDayName(ts.dayOfWeek)}, ${ts.startTime}-${ts.endTime}`,
                action: 'changeTime',
                newValue: ts.id
              });
            });
          });
        }
        
        // Add teacher change solutions
        if (conflict.type === 'TEACHER_CONFLICT' && teachers) {
          // For each conflicting lesson, add teacher change options
          conflictingLessons.forEach(lesson => {
            // Filter qualified teachers
            const qualifiedTeachers = teachers.filter(t => {
              // Check if teacher is already scheduled at this time
              const teacherBusy = scheduleDetails.some(d => 
                d.teacherId === t.id && 
                d.timeSlotId === lesson.timeSlotId &&
                d.id !== lesson.id
              );
              
              return !teacherBusy;
            });
            
            qualifiedTeachers.forEach(teacher => {
              possibleSolutions.push({
                id: `teacher-${lesson.id}-${teacher.id}`,
                description: `Ganti guru "${lesson.subject?.name}" menjadi ${teacher.name}`,
                action: 'changeTeacher',
                newValue: teacher.id
              });
            });
          });
        }
        
        // Add remove lesson option as last resort
        conflictingLessons.forEach(lesson => {
          possibleSolutions.push({
            id: `remove-${lesson.id}`,
            description: `Hapus pelajaran "${lesson.subject?.name}" dari jadwal`,
            action: 'removeLesson'
          });
        });
        
        // Extract detail IDs for resource and timeslot
        const detail1 = scheduleDetails.find(d => d.id === conflict.detailId1);
        const detail2 = scheduleDetails.find(d => d.id === conflict.detailId2);
        
        // Determine resource ID and time slot ID based on conflict type
        const resourceId = conflict.conflictType === 'teacher' 
          ? detail1?.teacherId || 0
          : detail1?.roomId || 0;
          
        const timeSlotId = detail1?.timeSlotId || 0;
        
        return {
          ...conflict,
          details: {
            conflictingLessons,
            possibleSolutions
          },
          // Map conflict properties for compatibility
          type: conflict.conflictType.toUpperCase() + '_CONFLICT',
          resourceId,
          timeSlotId
        };
      });
      
      setConflicts(enhancedConflicts);
    }
  }, [conflictsData, scheduleDetails, rooms, teachers, timeSlots]);

  const currentConflict = conflicts[currentConflictIndex];
  const totalConflicts = conflicts.length;
  const isFirstConflict = currentConflictIndex === 0;
  const isLastConflict = currentConflictIndex === totalConflicts - 1;

  // Handle navigation between conflicts
  const goToNextConflict = () => {
    if (!isLastConflict) {
      setCurrentConflictIndex(prev => prev + 1);
    } else {
      setStep(3); // Move to summary step
    }
  };

  const goToPrevConflict = () => {
    if (!isFirstConflict) {
      setCurrentConflictIndex(prev => prev - 1);
    } else {
      setStep(1); // Go back to intro step
    }
  };

  // Handle selecting a solution
  const handleSelectSolution = (solution: ConflictSolution) => {
    setConflicts(prev => {
      const updated = [...prev];
      updated[currentConflictIndex].selectedSolution = solution;
      return updated;
    });
  };

  // Apply all solutions
  const applyAllSolutions = async () => {
    setIsProcessing(true);
    
    try {
      // Apply each solution sequentially
      for (const conflict of conflicts) {
        if (!conflict.selectedSolution) continue;
        
        const solution = conflict.selectedSolution;
        const [actionType, detailId, newValue] = solution.id.split('-');
        
        if (actionType === 'remove') {
          // Handle remove lesson
          await apiRequest('DELETE', `/api/schedule-details/${detailId}`);
        } else {
          // Handle other changes
          await applySolutionMutation.mutateAsync({ 
            detailId: parseInt(detailId), 
            action: solution.action,
            newValue: solution.newValue
          });
        }
      }
      
      await refetchConflicts();
      
      toast({
        title: 'Berhasil',
        description: 'Semua solusi konflik telah diterapkan',
      });
      
      setIsResolutionComplete(true);
      setStep(3); // Move to completion step
    } catch (error: any) {
      toast({
        title: 'Gagal',
        description: error.message || 'Terjadi kesalahan saat menerapkan solusi',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setCurrentConflictIndex(0);
    setIsResolutionComplete(false);
    onClose();
  };

  if (!isOpen) return null;

  // Loading state
  if (isLoadingConflicts || isLoadingDetails) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Resolusi Konflik Jadwal</DialogTitle>
            <DialogDescription>
              Memuat data konflik jadwal...
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // No conflicts found
  if (conflicts.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Resolusi Konflik Jadwal</DialogTitle>
            <DialogDescription>
              Hasil pemeriksaan konflik jadwal
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Tidak ditemukan konflik jadwal</h3>
            <p className="text-muted-foreground mb-4">
              Jadwal yang dibuat tidak memiliki konflik. Semua pengajar dan ruangan telah dialokasikan dengan baik.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={handleClose}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Resolusi Konflik Jadwal</DialogTitle>
          <DialogDescription>
            {step === 1 && 'Ditemukan beberapa konflik dalam jadwal. Mari selesaikan satu per satu.'}
            {step === 2 && `Menyelesaikan konflik ${currentConflictIndex + 1} dari ${totalConflicts}`}
            {step === 3 && 'Ringkasan solusi konflik yang akan diterapkan'}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Introduction */}
        {step === 1 && (
          <>
            <div className="space-y-4 py-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-6 w-6 text-amber-500" />
                <h3 className="text-lg font-semibold">Ditemukan {conflicts.length} konflik jadwal</h3>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Wizard ini akan membantu Anda menyelesaikan konflik yang ditemukan dalam jadwal. 
                Setiap konflik akan ditampilkan beserta beberapa solusi yang dapat Anda pilih.
              </p>
              
              <div className="rounded-md bg-amber-50 p-4 border border-amber-200">
                <h4 className="font-medium mb-2">Jenis konflik yang ditemukan:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {conflicts.some(c => c.type === 'TEACHER_CONFLICT') && (
                    <li>Konflik guru (guru mengajar di kelas berbeda pada waktu yang sama)</li>
                  )}
                  {conflicts.some(c => c.type === 'ROOM_CONFLICT') && (
                    <li>Konflik ruangan (ruangan digunakan oleh kelas berbeda pada waktu yang sama)</li>
                  )}
                </ul>
              </div>
            </div>
            
            <DialogFooter>
              <Button onClick={() => setStep(2)}>
                Mulai Resolusi
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Step 2: Resolve conflicts one by one */}
        {step === 2 && currentConflict && (
          <>
            <div className="space-y-4 py-4">
              <div className="flex justify-between items-center">
                <Badge variant="outline" className="px-3 py-1 text-sm">
                  Konflik {currentConflictIndex + 1} dari {totalConflicts}
                </Badge>
                
                <Badge 
                  variant={currentConflict.type === 'TEACHER_CONFLICT' ? 'secondary' : 'destructive'}
                  className="px-3 py-1"
                >
                  {currentConflict.type === 'TEACHER_CONFLICT' ? 'Konflik Guru' : 'Konflik Ruangan'}
                </Badge>
              </div>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Detail Konflik</CardTitle>
                  <CardDescription>
                    {currentConflict.type === 'TEACHER_CONFLICT' 
                      ? 'Seorang guru dijadwalkan mengajar di beberapa kelas pada waktu yang sama'
                      : 'Sebuah ruangan dijadwalkan digunakan oleh beberapa kelas pada waktu yang sama'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium">Sumber Daya:</p>
                        <p>
                          {currentConflict.type === 'TEACHER_CONFLICT' 
                            ? currentConflict.details?.conflictingLessons[0]?.teacher?.name || 'Unknown Teacher'
                            : currentConflict.details?.conflictingLessons[0]?.room?.name || 'Unknown Room'
                          }
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">Waktu:</p>
                        <p>
                          {currentConflict.details?.conflictingLessons[0]?.timeSlot && 
                           getDayName(currentConflict.details.conflictingLessons[0].timeSlot.dayOfWeek)}, {' '}
                          {currentConflict.details?.conflictingLessons[0]?.timeSlot?.startTime} - {' '}
                          {currentConflict.details?.conflictingLessons[0]?.timeSlot?.endTime}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <p className="font-medium mb-1">Konflik Terjadi Antara:</p>
                      <ul className="space-y-1 ml-5 list-disc">
                        {currentConflict.details?.conflictingLessons.map(lesson => (
                          <li key={lesson.id}>
                            {lesson.subject?.name} - Kelas {lesson.class?.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div>
                <h4 className="text-sm font-medium mb-3">Pilih solusi untuk konflik ini:</h4>
                <RadioGroup
                  value={currentConflict.selectedSolution?.id}
                  onValueChange={(value) => {
                    const solution = currentConflict.details?.possibleSolutions.find(
                      s => s.id === value
                    );
                    if (solution) {
                      handleSelectSolution(solution);
                    }
                  }}
                  className="space-y-2"
                >
                  {currentConflict.details?.possibleSolutions.map(solution => (
                    <div
                      key={solution.id}
                      className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-accent"
                      onClick={() => handleSelectSolution(solution)}
                    >
                      <RadioGroupItem value={solution.id} id={solution.id} />
                      <Label
                        htmlFor={solution.id}
                        className="flex-1 cursor-pointer text-sm"
                      >
                        {solution.description}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                
                {!currentConflict.selectedSolution && (
                  <p className="text-sm text-red-500 mt-2">
                    <AlertCircle className="inline-block mr-1 h-4 w-4" />
                    Silakan pilih satu solusi untuk melanjutkan
                  </p>
                )}
              </div>
            </div>
            
            <DialogFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={goToPrevConflict}
                disabled={isProcessing}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                {isFirstConflict ? 'Kembali ke Intro' : 'Konflik Sebelumnya'}
              </Button>
              
              <Button
                onClick={goToNextConflict}
                disabled={!currentConflict.selectedSolution || isProcessing}
              >
                {isLastConflict ? 'Lihat Ringkasan' : 'Konflik Berikutnya'}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Step 3: Summary and apply */}
        {step === 3 && (
          <>
            <div className="space-y-4 py-4">
              <h3 className="text-lg font-semibold">Ringkasan Solusi</h3>
              
              {isResolutionComplete ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Semua Konflik Telah Diselesaikan</h3>
                  <p className="text-muted-foreground mb-4">
                    Jadwal telah diperbarui dengan penyelesaian konflik yang dipilih.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    Berikut adalah ringkasan solusi yang akan diterapkan untuk setiap konflik.
                    Silakan tinjau kembali sebelum menerapkan semua perubahan.
                  </p>
                  
                  <div className="space-y-3">
                    {conflicts.map((conflict, index) => (
                      <div 
                        key={conflict.id}
                        className="rounded-md border p-3 text-sm"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">
                            Konflik #{index + 1} - {conflict.type === 'TEACHER_CONFLICT' ? 'Guru' : 'Ruangan'}
                          </span>
                          
                          {!conflict.selectedSolution && (
                            <Badge variant="destructive">
                              Belum diselesaikan
                            </Badge>
                          )}
                        </div>
                        
                        {conflict.selectedSolution ? (
                          <p className="text-sm">
                            Solusi: {conflict.selectedSolution.description}
                          </p>
                        ) : (
                          <p className="text-red-500 text-sm">
                            Silakan kembali dan pilih solusi untuk konflik ini
                          </p>
                        )}
                        
                        <div className="flex justify-end mt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setStep(2);
                              setCurrentConflictIndex(index);
                            }}
                          >
                            Edit Solusi
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            
            <DialogFooter>
              {isResolutionComplete ? (
                <Button onClick={handleClose}>
                  Selesai
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStep(2);
                      setCurrentConflictIndex(conflicts.length - 1);
                    }}
                    disabled={isProcessing}
                  >
                    Kembali
                  </Button>
                  
                  <Button
                    onClick={applyAllSolutions}
                    disabled={conflicts.some(c => !c.selectedSolution) || isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Menerapkan Solusi...
                      </>
                    ) : (
                      'Terapkan Semua Solusi'
                    )}
                  </Button>
                </>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ConflictResolutionWizard;