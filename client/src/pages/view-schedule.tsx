import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Schedule, ScheduleDetail, TimeSlot, Class, Teacher, Room } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ScheduleTable from '@/components/schedule/schedule-table';
import { exportToExcel, exportToPDF, printSchedule } from '@/lib/export-utils';
import { Loader2, FileDown, Printer } from 'lucide-react';

interface ViewScheduleProps {
  scheduleId?: number;
}

type ViewType = 'class' | 'teacher' | 'room';

const ViewSchedule: React.FC<ViewScheduleProps> = ({ scheduleId }) => {
  const [viewType, setViewType] = useState<ViewType>('class');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Fetch available schedules if no scheduleId is provided
  const { data: schedules, isLoading: schedulesLoading } = useQuery<Schedule[]>({
    queryKey: ['/api/schedules'],
    enabled: !scheduleId,
  });

  // If scheduleId is provided, fetch that specific schedule
  const { data: schedule, isLoading: scheduleLoading } = useQuery<Schedule>({
    queryKey: [`/api/schedules/${scheduleId}`],
    enabled: !!scheduleId,
  });

  // Fetch schedule details for selected schedule
  const { data: scheduleDetails, isLoading: detailsLoading } = useQuery<ScheduleDetail[]>({
    queryKey: [`/api/schedules/${scheduleId || selectedId}/details`],
    enabled: !!(scheduleId || selectedId),
  });

  // Fetch time slots
  const { data: timeSlots, isLoading: timeSlotsLoading } = useQuery<TimeSlot[]>({
    queryKey: ['/api/time-slots'],
  });

  // Fetch classes
  const { data: classes, isLoading: classesLoading } = useQuery<Class[]>({
    queryKey: ['/api/classes'],
  });

  // Fetch teachers
  const { data: teachers, isLoading: teachersLoading } = useQuery<Teacher[]>({
    queryKey: ['/api/teachers'],
  });

  // Fetch rooms
  const { data: rooms, isLoading: roomsLoading } = useQuery<Room[]>({
    queryKey: ['/api/rooms'],
  });

  // If scheduleId is provided, select it automatically
  useEffect(() => {
    if (scheduleId) {
      setSelectedId(scheduleId);
    } else if (schedules && schedules.length > 0 && !selectedId) {
      // If no scheduleId provided but schedules are loaded, select the first one
      setSelectedId(schedules[0].id);
    }
  }, [scheduleId, schedules, selectedId]);

  // Set first class/teacher/room as selected when data is loaded
  useEffect(() => {
    if (viewType === 'class' && classes && classes.length > 0 && !selectedId) {
      setSelectedId(classes[0].id);
    } else if (viewType === 'teacher' && teachers && teachers.length > 0 && !selectedId) {
      setSelectedId(teachers[0].id);
    } else if (viewType === 'room' && rooms && rooms.length > 0 && !selectedId) {
      setSelectedId(rooms[0].id);
    }
  }, [viewType, classes, teachers, rooms, selectedId]);

  // Handle export to Excel
  const handleExportExcel = () => {
    if (!scheduleDetails || !timeSlots || !schedule) return;
    
    exportToExcel(
      scheduleDetails,
      timeSlots,
      schedule.name
    );
  };

  // Handle export to PDF
  const handleExportPDF = () => {
    if (!scheduleDetails || !timeSlots || !schedule) return;
    
    exportToPDF(
      scheduleDetails,
      timeSlots,
      schedule.name,
      viewType,
      selectedId || undefined
    );
  };

  // Handle print
  const handlePrint = () => {
    if (!scheduleDetails || !timeSlots || !schedule) return;
    
    printSchedule(
      scheduleDetails,
      timeSlots,
      schedule.name,
      viewType,
      selectedId || undefined
    );
  };

  // Loading state
  const isLoading = scheduleLoading || schedulesLoading || detailsLoading || 
                   timeSlotsLoading || classesLoading || teachersLoading || roomsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If no schedules are available
  if (!schedule && (!schedules || schedules.length === 0)) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-10">
            <h3 className="text-lg font-medium text-gray-900">Jadwal tidak tersedia</h3>
            <p className="mt-2 text-sm text-gray-500">Belum ada jadwal yang dibuat</p>
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

  // Get current schedule to display
  const currentSchedule = schedule || (selectedId && schedules?.find(s => s.id === selectedId));

  // Get filter options based on view type
  const getFilterOptions = () => {
    switch (viewType) {
      case 'class':
        return classes || [];
      case 'teacher':
        return teachers || [];
      case 'room':
        return rooms || [];
      default:
        return [];
    }
  };

  // Get option name based on view type and id
  const getOptionName = (id: number) => {
    switch (viewType) {
      case 'class':
        return classes?.find(c => c.id === id)?.name || `Kelas ${id}`;
      case 'teacher':
        return teachers?.find(t => t.id === id)?.name || `Guru ${id}`;
      case 'room':
        return rooms?.find(r => r.id === id)?.name || `Ruang ${id}`;
      default:
        return '';
    }
  };

  // Format title based on view type
  const getTitle = () => {
    if (!currentSchedule) return 'Lihat Jadwal';
    
    let filterTitle = '';
    if (selectedId) {
      filterTitle = ` - ${getOptionName(selectedId)}`;
    }
    
    return `${currentSchedule.name}${filterTitle}`;
  };

  const filterOptions = getFilterOptions();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="px-6 py-4 border-b border-gray-200 flex flex-wrap justify-between items-center">
          <CardTitle className="text-lg font-medium text-gray-900">
            {getTitle()}
          </CardTitle>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleExportExcel} className="flex items-center space-x-1">
              <FileDown className="h-4 w-4 mr-1" />
              Excel
            </Button>
            <Button variant="outline" onClick={handleExportPDF} className="flex items-center space-x-1">
              <FileDown className="h-4 w-4 mr-1" />
              PDF
            </Button>
            <Button variant="outline" onClick={handlePrint} className="flex items-center space-x-1">
              <Printer className="h-4 w-4 mr-1" />
              Cetak
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-6 py-4">
          <div className="mb-4 flex flex-wrap gap-2 sm:flex-row">
            {/* Schedule selector (visible if scheduleId is not provided) */}
            {!scheduleId && schedules && schedules.length > 0 && (
              <div className="relative w-full sm:w-64 mb-2">
                <label htmlFor="scheduleFilter" className="block text-sm font-medium text-gray-700 mb-1">
                  Pilih Jadwal
                </label>
                <Select
                  value={selectedId?.toString() || ""}
                  onValueChange={(value) => setSelectedId(parseInt(value))}
                >
                  <SelectTrigger id="scheduleFilter" className="w-full">
                    <SelectValue placeholder="Pilih Jadwal" />
                  </SelectTrigger>
                  <SelectContent>
                    {schedules.map((s) => (
                      <SelectItem key={s.id} value={s.id.toString()}>
                        {s.name} ({s.academicYear})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* View type filter */}
            <div className="relative w-full sm:w-64 mb-2">
              <label htmlFor="viewFilter" className="block text-sm font-medium text-gray-700 mb-1">
                Filter Tampilan
              </label>
              <Select
                value={viewType}
                onValueChange={(value: ViewType) => {
                  setViewType(value);
                  setSelectedId(null); // Reset selection when changing view type
                }}
              >
                <SelectTrigger id="viewFilter" className="w-full">
                  <SelectValue placeholder="Pilih Tampilan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="class">Per Kelas</SelectItem>
                  <SelectItem value="teacher">Per Guru</SelectItem>
                  <SelectItem value="room">Per Ruang</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Entity filter based on selected view type */}
            <div className="relative w-full sm:w-64 mb-2">
              <label htmlFor="entityFilter" className="block text-sm font-medium text-gray-700 mb-1">
                Pilih {viewType === 'class' ? 'Kelas' : viewType === 'teacher' ? 'Guru' : 'Ruangan'}
              </label>
              <Select
                value={selectedId?.toString() || ""}
                onValueChange={(value) => setSelectedId(parseInt(value))}
              >
                <SelectTrigger id="entityFilter" className="w-full">
                  <SelectValue placeholder={`Pilih ${viewType === 'class' ? 'Kelas' : viewType === 'teacher' ? 'Guru' : 'Ruangan'}`} />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.map((option: any) => (
                    <SelectItem key={option.id} value={option.id.toString()}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Schedule table */}
          {scheduleDetails && timeSlots && selectedId ? (
            <ScheduleTable
              scheduleDetails={scheduleDetails}
              timeSlots={timeSlots}
              classId={viewType === 'class' ? selectedId : undefined}
              teacherId={viewType === 'teacher' ? selectedId : undefined}
              roomId={viewType === 'room' ? selectedId : undefined}
              readOnly={true}
            />
          ) : (
            <div className="py-10 text-center text-gray-500">
              Pilih jadwal untuk melihat detailnya
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ViewSchedule;
