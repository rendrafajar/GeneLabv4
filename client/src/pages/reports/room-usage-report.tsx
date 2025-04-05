import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Download, Building, FileText } from 'lucide-react';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
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
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

import { Schedule, ScheduleDetail, Room, Class, Subject, TimeSlot } from '@shared/schema';
import { ScheduleDetailWithDuration } from '@/components/interfaces/report-interfaces';

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

const RoomUsageReport = () => {
  const [selectedSchedule, setSelectedSchedule] = useState<string>('');

  // Fetch schedules
  const { data: schedules, isLoading: isLoadingSchedules } = useQuery<Schedule[]>({
    queryKey: ['/api/schedules'],
  });

  // Fetch schedule details for the selected schedule
  const { data: scheduleDetails, isLoading: isLoadingDetails } = useQuery<ScheduleDetail[]>({
    queryKey: ['/api/schedules', selectedSchedule, 'details'],
    queryFn: async () => {
      if (!selectedSchedule) return [];
      const res = await fetch(`/api/schedules/${selectedSchedule}/details`);
      if (!res.ok) throw new Error('Gagal memuat detail jadwal');
      return res.json();
    },
    enabled: !!selectedSchedule,
  });

  // Fetch rooms
  const { data: rooms } = useQuery<Room[]>({
    queryKey: ['/api/rooms'],
    enabled: !!selectedSchedule,
  });

  // Fetch classes
  const { data: classes } = useQuery<Class[]>({
    queryKey: ['/api/classes'],
    enabled: !!selectedSchedule,
  });

  // Fetch subjects
  const { data: subjects } = useQuery<Subject[]>({
    queryKey: ['/api/subjects'],
    enabled: !!selectedSchedule,
  });

  // Fetch timeslots
  const { data: timeSlots } = useQuery<TimeSlot[]>({
    queryKey: ['/api/timeslots'],
    enabled: !!selectedSchedule,
  });

  // Enrich schedule details with calculated duration
  const detailsWithDuration = useMemo<ScheduleDetailWithDuration[]>(() => {
    if (!scheduleDetails || !timeSlots) return [];
    
    return scheduleDetails.map(detail => {
      // Calculate duration in minutes for each timeslot
      const timeSlot = timeSlots.find(ts => ts.id === detail.timeSlotId);
      const duration = timeSlot ? 45 : 0; // Default 45 minutes per session
      
      return {
        ...detail,
        duration
      };
    });
  }, [scheduleDetails, timeSlots]);

  // Calculate room usage statistics
  const roomStats = useMemo(() => {
    if (!detailsWithDuration || !rooms || !timeSlots) return [];
    
    // Calculate total available slots in a week
    const totalAvailableHours = rooms.map(room => {
      // Assume 5 days per week (Mon-Fri), with 10 slots per day as max capacity
      // In a real implementation, this would be calculated based on timeslots configuration
      const maxSlotsPerWeek = 5 * 10; 
      const totalMinutesAvailable = maxSlotsPerWeek * 45; // 45 minutes per slot
      
      const roomDetails = detailsWithDuration.filter(d => d.roomId === room.id);
      const useCount = roomDetails.length;
      const usedMinutes = roomDetails.reduce((sum, d) => sum + d.duration, 0);
      
      const usagePercent = Math.min(Math.round((usedMinutes / totalMinutesAvailable) * 100), 100);
      
      // Group usage by days
      const usageByDay = [1, 2, 3, 4, 5].map(dayOfWeek => {
        // Get all slots for this day
        const daySlotIds = timeSlots
          .filter(ts => ts.dayOfWeek === dayOfWeek)
          .map(ts => ts.id);
        
        // Filter room details for this day
        const dayDetails = roomDetails.filter(d => daySlotIds.includes(d.timeSlotId));
        
        return {
          day: dayOfWeek,
          dayName: getDayName(dayOfWeek),
          slotCount: dayDetails.length,
          totalMinutes: dayDetails.reduce((sum, d) => sum + d.duration, 0)
        };
      });
      
      // Get classes using this room
      const classIdMap: Record<number, boolean> = {};
      roomDetails.forEach(d => {
        classIdMap[d.classId] = true;
      });
      const classIds = Object.keys(classIdMap).map(id => parseInt(id));
      const classesUsingRoom = classIds.map(id => {
        const classObj = classes?.find(c => c.id === id);
        return classObj?.name || 'Unknown Class';
      });
      
      return {
        room,
        useCount,
        usedMinutes,
        usagePercent,
        usageByDay,
        classesUsingRoom,
        utilizationLevel: usagePercent < 30 ? 'rendah' : usagePercent < 70 ? 'sedang' : 'tinggi'
      };
    }).sort((a, b) => b.usagePercent - a.usagePercent); // Sort by highest usage
    
    return totalAvailableHours;
  }, [detailsWithDuration, rooms, timeSlots, classes]);

  // Export to PDF
  const exportToPDF = () => {
    if (!roomStats.length) return;

    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text('Laporan Penggunaan Ruangan', 14, 15);
    
    const selectedScheduleObj = schedules?.find(s => s.id.toString() === selectedSchedule);
    if (selectedScheduleObj) {
      doc.setFontSize(11);
      doc.text(`Jadwal: ${selectedScheduleObj.name}`, 14, 22);
      doc.text(`Tahun Ajaran: ${selectedScheduleObj.academicYear}`, 14, 28);
    }
    
    // Add report date
    doc.setFontSize(10);
    doc.text(`Tanggal: ${format(new Date(), 'dd MMMM yyyy', { locale: id })}`, 14, 35);
    
    // Add summary stats
    doc.setFontSize(11);
    doc.text('Ringkasan Penggunaan Ruangan:', 14, 45);
    
    // Get overall statistics
    const totalRooms = roomStats.length;
    const avgUtilization = roomStats.reduce((sum, r) => sum + r.usagePercent, 0) / totalRooms;
    const underutilizedRooms = roomStats.filter(r => r.utilizationLevel === 'rendah').length;
    const optimalRooms = roomStats.filter(r => r.utilizationLevel === 'sedang').length;
    const overutilizedRooms = roomStats.filter(r => r.utilizationLevel === 'tinggi').length;
    
    doc.setFontSize(10);
    doc.text(`Total Ruangan: ${totalRooms}`, 20, 52);
    doc.text(`Rata-rata Penggunaan: ${avgUtilization.toFixed(1)}%`, 20, 58);
    doc.text(`Ruangan dengan Penggunaan Rendah: ${underutilizedRooms}`, 20, 64);
    doc.text(`Ruangan dengan Penggunaan Optimal: ${optimalRooms}`, 20, 70);
    doc.text(`Ruangan dengan Penggunaan Tinggi: ${overutilizedRooms}`, 20, 76);
    
    // Add room usage table
    const tableData = roomStats.map(stat => [
      stat.room.name,
      stat.room.code,
      stat.room.type,
      stat.useCount.toString(),
      `${Math.round(stat.usedMinutes / 60).toFixed(1)} jam`,
      `${stat.usagePercent}%`,
      stat.utilizationLevel.charAt(0).toUpperCase() + stat.utilizationLevel.slice(1)
    ]);
    
    (doc as any).autoTable({
      startY: 85,
      head: [['Nama Ruangan', 'Kode', 'Tipe', 'Sesi', 'Total Jam', 'Persentase', 'Level']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [51, 102, 153] },
      margin: { left: 14, right: 14 },
      tableWidth: 'auto'
    });
    
    // For each room, add daily usage breakdown on new pages
    roomStats.forEach((stat, index) => {
      // Only add details for the top 10 most used rooms
      if (index < 10) {
        doc.addPage();
        
        doc.setFontSize(14);
        doc.text(`Detail Penggunaan Ruangan: ${stat.room.name} (${stat.room.code})`, 14, 20);
        
        doc.setFontSize(10);
        doc.text(`Tipe: ${stat.room.type}`, 14, 30);
        doc.text(`Kapasitas: ${stat.room.capacity} orang`, 14, 36);
        doc.text(`Total Penggunaan: ${stat.useCount} sesi (${Math.round(stat.usedMinutes / 60).toFixed(1)} jam)`, 14, 42);
        doc.text(`Persentase Penggunaan: ${stat.usagePercent}%`, 14, 48);
        
        // Add daily breakdown table
        const dayData = stat.usageByDay.map(day => [
          day.dayName,
          day.slotCount.toString(),
          `${Math.round(day.totalMinutes / 60).toFixed(1)} jam`,
          `${Math.round((day.slotCount / 10) * 100)}%`
        ]);
        
        (doc as any).autoTable({
          startY: 55,
          head: [['Hari', 'Sesi', 'Jam', 'Penggunaan']],
          body: dayData,
          theme: 'grid',
          headStyles: { fillColor: [100, 100, 100] },
          margin: { left: 14, right: 14 },
          tableWidth: 'auto'
        });
        
        // List classes using this room
        const yPos = (doc as any).lastAutoTable.finalY + 15;
        doc.setFontSize(12);
        doc.text('Kelas Pengguna Ruangan:', 14, yPos);
        
        let classText = '';
        stat.classesUsingRoom.forEach((className, i) => {
          classText += className;
          if (i < stat.classesUsingRoom.length - 1) {
            classText += ', ';
          }
          
          // Break into new lines every 5 classes
          if ((i + 1) % 5 === 0) {
            classText += '\n';
          }
        });
        
        doc.setFontSize(10);
        doc.text(classText, 14, yPos + 10, { maxWidth: 180 });
      }
    });
    
    doc.save('laporan_penggunaan_ruangan.pdf');
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Laporan Penggunaan Ruangan</h1>
          <p className="text-muted-foreground">
            Analisis tingkat pemanfaatan ruangan dan distribusi penggunaan
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Filter Laporan</CardTitle>
          <CardDescription>Pilih jadwal untuk melihat data penggunaan ruangan</CardDescription>
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
                disabled={!roomStats?.length}
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
          {isLoadingDetails ? (
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
          ) : roomStats.length > 0 ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Penggunaan Ruangan</CardTitle>
                <CardDescription>
                  Total {roomStats.length} ruangan dengan tingkat penggunaan bervariasi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Ruangan</TableHead>
                      <TableHead>Kode</TableHead>
                      <TableHead>Tipe</TableHead>
                      <TableHead className="text-center">Sesi</TableHead>
                      <TableHead className="text-center">Tingkat Penggunaan</TableHead>
                      <TableHead>Level</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roomStats.map((stat) => (
                      <TableRow key={stat.room.id}>
                        <TableCell className="font-medium">{stat.room.name}</TableCell>
                        <TableCell>{stat.room.code}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {stat.room.type === 'teori' ? 'Teori' : 'Praktikum'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">{stat.useCount}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={stat.usagePercent} 
                              className="h-2"
                            />
                            <span className="w-10 text-right">{stat.usagePercent}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              stat.utilizationLevel === 'rendah'
                                ? 'outline'
                                : stat.utilizationLevel === 'sedang'
                                ? 'secondary'
                                : 'default'
                            }
                          >
                            {stat.utilizationLevel.charAt(0).toUpperCase() + stat.utilizationLevel.slice(1)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-10 text-center">
                <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Tidak ada data penggunaan ruangan</h3>
                <p className="text-muted-foreground mb-4">
                  Jadwal yang dipilih tidak memiliki data detail yang cukup untuk analisis
                </p>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-10 text-center">
            <Building className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Pilih Jadwal</h3>
            <p className="text-muted-foreground mb-4">
              Silakan pilih jadwal terlebih dahulu untuk melihat laporan penggunaan ruangan
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RoomUsageReport;