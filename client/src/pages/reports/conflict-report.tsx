import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { AlertTriangle, Download, FileText } from 'lucide-react';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

import { Schedule, ScheduleConflict, Class, Teacher, Room, TimeSlot } from '@shared/schema';
import { ConflictDisplay } from '@/components/interfaces/report-interfaces';

// Helper to convert day number to day name
const getDayName = (day: number): string => {
  const days: Record<number, string> = {
    1: 'Senin',
    2: 'Selasa',
    3: 'Rabu',
    4: 'Kamis',
    5: 'Jumat',
    6: 'Sabtu',
    7: 'Minggu',
  };
  return days[day] || 'Unknown';
};

// Helper to map conflict type to human-readable string
const getConflictTypeName = (conflictType: string): string => {
  const types: Record<string, string> = {
    'teacher': 'Guru Bentrok',
    'class': 'Kelas Bentrok',
    'room': 'Ruangan Bentrok',
  };
  return types[conflictType] || 'Bentrok Tidak Diketahui';
};

const ConflictReport = () => {
  const [selectedSchedule, setSelectedSchedule] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('all');

  // Fetch schedules
  const { data: schedules, isLoading: isLoadingSchedules } = useQuery<Schedule[]>({
    queryKey: ['/api/schedules'],
  });

  // Fetch conflicts for the selected schedule
  const { data: conflicts, isLoading: isLoadingConflicts } = useQuery<ScheduleConflict[]>({
    queryKey: ['/api/schedules', selectedSchedule, 'conflicts'],
    queryFn: async () => {
      if (!selectedSchedule) return [];
      const res = await fetch(`/api/schedules/${selectedSchedule}/conflicts`);
      if (!res.ok) throw new Error('Gagal memuat data konflik jadwal');
      return res.json();
    },
    enabled: !!selectedSchedule,
  });

  // Fetch additional data for enriching conflict details
  const { data: classes } = useQuery<Class[]>({
    queryKey: ['/api/classes'],
    enabled: !!selectedSchedule,
  });

  const { data: teachers } = useQuery<Teacher[]>({
    queryKey: ['/api/teachers'],
    enabled: !!selectedSchedule,
  });

  const { data: rooms } = useQuery<Room[]>({
    queryKey: ['/api/rooms'],
    enabled: !!selectedSchedule,
  });

  const { data: timeSlots } = useQuery<TimeSlot[]>({
    queryKey: ['/api/timeslots'],
    enabled: !!selectedSchedule,
  });

  // Transform conflicts to display model
  const displayConflicts = React.useMemo<ConflictDisplay[]>(() => {
    if (!conflicts) return [];
    
    return conflicts.map(conflict => {
      // Add derived fields for display purposes
      const resourceId = conflict.detailId1; // Simplified for display
      const timeSlotId = 1; // Placeholder - would calculate from schedule details
      
      return {
        ...conflict,
        resourceId,
        timeSlotId
      };
    });
  }, [conflicts]);

  // Filter conflicts by type
  const filteredConflicts = React.useMemo(() => {
    if (!displayConflicts) return [];
    if (activeTab === 'all') return displayConflicts;
    return displayConflicts.filter(conflict => conflict.conflictType === activeTab);
  }, [displayConflicts, activeTab]);

  // Compute conflict stats
  const conflictStats = React.useMemo(() => {
    if (!displayConflicts) return { total: 0, teacher: 0, class: 0, room: 0 };
    
    return {
      total: displayConflicts.length,
      teacher: displayConflicts.filter(c => c.conflictType === 'teacher').length,
      class: displayConflicts.filter(c => c.conflictType === 'class').length,
      room: displayConflicts.filter(c => c.conflictType === 'room').length
    };
  }, [displayConflicts]);

  // Helper functions to get names
  const getClassName = (classId: number) => {
    return classes?.find(c => c.id === classId)?.name || 'Kelas Tidak Diketahui';
  };

  const getTeacherName = (teacherId: number) => {
    return teachers?.find(t => t.id === teacherId)?.name || 'Guru Tidak Diketahui';
  };

  const getRoomName = (roomId: number) => {
    return rooms?.find(r => r.id === roomId)?.name || 'Ruangan Tidak Diketahui';
  };

  const getTimeSlotInfo = (timeSlotId: number) => {
    const timeSlot = timeSlots?.find(ts => ts.id === timeSlotId);
    if (!timeSlot) return 'Waktu Tidak Diketahui';
    return `${getDayName(timeSlot.dayOfWeek)}, ${timeSlot.startTime} - ${timeSlot.endTime}`;
  };

  // Export to PDF
  const exportToPDF = () => {
    if (!filteredConflicts.length) return;

    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text('Laporan Konflik Jadwal', 14, 15);
    
    const selectedScheduleObj = schedules?.find(s => s.id.toString() === selectedSchedule);
    if (selectedScheduleObj) {
      doc.setFontSize(11);
      doc.text(`Jadwal: ${selectedScheduleObj.name}`, 14, 22);
      doc.text(`Tahun Ajaran: ${selectedScheduleObj.academicYear}`, 14, 28);
    }
    
    // Add report date
    doc.setFontSize(10);
    doc.text(`Tanggal: ${format(new Date(), 'dd MMMM yyyy', { locale: id })}`, 14, 35);
    
    // Add conflict stats
    doc.setFontSize(11);
    doc.text('Ringkasan Konflik:', 14, 45);
    doc.setFontSize(10);
    doc.text(`Total Konflik: ${conflictStats.total}`, 20, 52);
    doc.text(`Konflik Guru: ${conflictStats.teacher}`, 20, 58);
    doc.text(`Konflik Kelas: ${conflictStats.class}`, 20, 64);
    doc.text(`Konflik Ruangan: ${conflictStats.room}`, 20, 70);
    
    // Add conflict details table
    const tableData = filteredConflicts.map(conflict => {
      let details = '';
      if (conflict.conflictType === 'teacher') {
        details = `Guru: ${getTeacherName(conflict.resourceId || 0)}`;
      } else if (conflict.conflictType === 'class') {
        details = `Kelas: ${getClassName(conflict.resourceId || 0)}`;
      } else if (conflict.conflictType === 'room') {
        details = `Ruangan: ${getRoomName(conflict.resourceId || 0)}`;
      }
      
      return [
        getConflictTypeName(conflict.conflictType),
        details,
        conflict.timeSlotId ? getTimeSlotInfo(conflict.timeSlotId) : '-',
        conflict.description || '-'
      ];
    });
    
    (doc as any).autoTable({
      startY: 80,
      head: [['Tipe Konflik', 'Detail', 'Waktu', 'Keterangan']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [51, 102, 153] },
      margin: { left: 14, right: 14 },
      tableWidth: 'auto'
    });
    
    doc.save('laporan_konflik_jadwal.pdf');
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Laporan Konflik Jadwal</h1>
          <p className="text-muted-foreground">
            Analisis bentrok jadwal berdasarkan guru, kelas, dan ruangan
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Filter Laporan</CardTitle>
          <CardDescription>Pilih jadwal untuk melihat konflik yang terjadi</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Jadwal</label>
              <Select value={selectedSchedule} onValueChange={setSelectedSchedule}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jadwal" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingSchedules ? (
                    <SelectItem value="loading" disabled>
                      Memuat jadwal...
                    </SelectItem>
                  ) : schedules?.length ? (
                    schedules.map((schedule) => (
                      <SelectItem key={schedule.id} value={schedule.id.toString()}>
                        {schedule.name} ({schedule.academicYear})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="empty" disabled>
                      Tidak ada jadwal
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2 flex items-end">
              <Button
                variant="outline"
                className="ml-auto"
                onClick={exportToPDF}
                disabled={!filteredConflicts.length}
              >
                <Download className="mr-2 h-4 w-4" />
                Ekspor ke PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedSchedule ? (
        <>
          {isLoadingConflicts ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-1/3" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array(5).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : conflicts && conflicts.length > 0 ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Daftar Konflik Jadwal</CardTitle>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant={conflictStats.total === 0 ? "success" : "destructive"} className="text-sm py-1">
                    Total: {conflictStats.total} konflik
                  </Badge>
                  <Badge variant="outline" className="text-sm py-1">
                    Guru: {conflictStats.teacher}
                  </Badge>
                  <Badge variant="outline" className="text-sm py-1">
                    Kelas: {conflictStats.class}
                  </Badge>
                  <Badge variant="outline" className="text-sm py-1">
                    Ruangan: {conflictStats.room}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="all">Semua</TabsTrigger>
                    <TabsTrigger value="teacher">Guru</TabsTrigger>
                    <TabsTrigger value="class">Kelas</TabsTrigger>
                    <TabsTrigger value="room">Ruangan</TabsTrigger>
                  </TabsList>
                  <TabsContent value={activeTab} className="mt-4">
                    {filteredConflicts.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[180px]">Tipe Konflik</TableHead>
                            <TableHead>Detail</TableHead>
                            <TableHead>Waktu</TableHead>
                            <TableHead>Keterangan</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredConflicts.map((conflict) => (
                            <TableRow key={conflict.id}>
                              <TableCell>
                                <Badge variant="outline" className="font-normal">
                                  {getConflictTypeName(conflict.conflictType)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {conflict.conflictType === 'teacher' && (
                                  <div className="font-medium">{getTeacherName(conflict.resourceId || 0)}</div>
                                )}
                                {conflict.conflictType === 'class' && (
                                  <div className="font-medium">{getClassName(conflict.resourceId || 0)}</div>
                                )}
                                {conflict.conflictType === 'room' && (
                                  <div className="font-medium">{getRoomName(conflict.resourceId || 0)}</div>
                                )}
                              </TableCell>
                              <TableCell>
                                {conflict.timeSlotId ? getTimeSlotInfo(conflict.timeSlotId) : '-'}
                              </TableCell>
                              <TableCell>{conflict.description || '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-8 text-center">
                        <AlertTriangle className="h-10 w-10 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">Tidak ada konflik</h3>
                        <p className="text-muted-foreground">
                          Tidak ditemukan konflik jadwal untuk kategori yang dipilih
                        </p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
              {filteredConflicts.length > 0 && (
                <CardFooter className="border-t pt-6">
                  <p className="text-sm text-muted-foreground">
                    <AlertTriangle className="h-4 w-4 inline-block mr-1" />
                    Konflik jadwal harus diselesaikan untuk memastikan jadwal dapat berjalan dengan baik.
                    Gunakan wizard resolusi konflik untuk menyelesaikan masalah.
                  </p>
                </CardFooter>
              )}
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-10 text-center">
                <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Tidak ada konflik jadwal</h3>
                <p className="text-muted-foreground mb-4">
                  Jadwal yang dipilih tidak memiliki konflik atau belum dianalisis
                </p>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-10 text-center">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Pilih Jadwal</h3>
            <p className="text-muted-foreground mb-4">
              Silakan pilih jadwal terlebih dahulu untuk melihat laporan konflik
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ConflictReport;