import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Download, BarChart, FileText } from 'lucide-react';

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

import { Schedule, ScheduleDetail, Teacher, Subject, TimeSlot } from '@shared/schema';
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

const TeacherLoadReport = () => {
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

  // Fetch teachers
  const { data: teachers } = useQuery<Teacher[]>({
    queryKey: ['/api/teachers'],
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

  // Calculate teacher workload statistics
  const teacherStats = useMemo(() => {
    if (!detailsWithDuration || !teachers) return [];
    
    const stats = teachers.map(teacher => {
      const teacherDetails = detailsWithDuration.filter(d => d.teacherId === teacher.id);
      const totalSessions = teacherDetails.length;
      const totalHours = teacherDetails.reduce((sum, d) => sum + d.duration, 0) / 60;
      
      // Group by subjects to count unique subjects
      const subjectGroups = teacherDetails.reduce((groups, detail) => {
        if (!groups[detail.subjectId]) {
          groups[detail.subjectId] = [];
        }
        groups[detail.subjectId].push(detail);
        return groups;
      }, {} as Record<number, ScheduleDetailWithDuration[]>);
      
      const uniqueSubjects = Object.keys(subjectGroups).length;
      
      // Get subject names
      const subjectList = Object.entries(subjectGroups).map(([subjectId, details]) => {
        const subject = subjects?.find(s => s.id === parseInt(subjectId));
        return {
          name: subject?.name || 'Unknown Subject',
          sessionCount: details.length,
          hoursCount: details.reduce((sum, d) => sum + d.duration, 0) / 60
        };
      });
      
      return {
        teacher,
        totalSessions,
        totalHours,
        uniqueSubjects,
        subjectList,
        workloadLevel: totalHours <= 10 ? 'rendah' : totalHours <= 20 ? 'sedang' : 'tinggi'
      };
    }).sort((a, b) => b.totalHours - a.totalHours); // Sort by highest workload
    
    return stats;
  }, [detailsWithDuration, teachers, subjects]);

  // Export to PDF
  const exportToPDF = () => {
    if (!teacherStats.length) return;

    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text('Laporan Beban Mengajar Guru', 14, 15);
    
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
    doc.text('Ringkasan Beban Mengajar:', 14, 45);
    doc.setFontSize(10);
    doc.text(`Total Guru: ${teacherStats.length}`, 20, 52);
    
    const avgHours = teacherStats.reduce((sum, t) => sum + t.totalHours, 0) / teacherStats.length;
    doc.text(`Rata-rata Jam Mengajar: ${avgHours.toFixed(1)} jam per minggu`, 20, 58);
    
    // Add teacher workload table
    const tableData = teacherStats.map(stat => [
      stat.teacher.name,
      stat.teacher.code,
      stat.totalSessions.toString(),
      `${stat.totalHours.toFixed(1)} jam`,
      stat.uniqueSubjects.toString(),
      stat.workloadLevel.charAt(0).toUpperCase() + stat.workloadLevel.slice(1)
    ]);
    
    (doc as any).autoTable({
      startY: 65,
      head: [['Nama Guru', 'Kode', 'Sesi', 'Total Jam', 'Mapel', 'Level Beban']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [51, 102, 153] },
      margin: { left: 14, right: 14 },
      tableWidth: 'auto'
    });
    
    // For each teacher, add detailed subject breakdown
    let yPosition = (doc as any).lastAutoTable.finalY + 20;
    
    teacherStats.forEach((stat, index) => {
      // Check if we need to add a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(12);
      doc.text(`Detail Beban Guru: ${stat.teacher.name} (${stat.teacher.code})`, 14, yPosition);
      
      const subjectData = stat.subjectList.map(subject => [
        subject.name,
        subject.sessionCount.toString(),
        `${subject.hoursCount.toFixed(1)} jam`
      ]);
      
      (doc as any).autoTable({
        startY: yPosition + 5,
        head: [['Mata Pelajaran', 'Sesi', 'Jam']],
        body: subjectData,
        theme: 'grid',
        headStyles: { fillColor: [100, 100, 100] },
        margin: { left: 20, right: 20 },
        tableWidth: 'auto'
      });
      
      yPosition = (doc as any).lastAutoTable.finalY + 15;
    });
    
    doc.save('laporan_beban_guru.pdf');
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Laporan Beban Mengajar Guru</h1>
          <p className="text-muted-foreground">
            Analisis distribusi beban mengajar dan alokasi sumber daya guru
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Filter Laporan</CardTitle>
          <CardDescription>Pilih jadwal untuk melihat data beban guru</CardDescription>
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
                disabled={!teacherStats?.length}
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
          ) : teacherStats.length > 0 ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Beban Mengajar Guru</CardTitle>
                <CardDescription>
                  Total {teacherStats.length} guru dengan beban mengajar bervariasi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Guru</TableHead>
                      <TableHead>Kode</TableHead>
                      <TableHead className="text-center">Total Sesi</TableHead>
                      <TableHead className="text-center">Total Jam</TableHead>
                      <TableHead className="text-center">Jumlah Mapel</TableHead>
                      <TableHead>Level Beban</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teacherStats.map((stat) => (
                      <TableRow key={stat.teacher.id}>
                        <TableCell className="font-medium">{stat.teacher.name}</TableCell>
                        <TableCell>{stat.teacher.code}</TableCell>
                        <TableCell className="text-center">{stat.totalSessions}</TableCell>
                        <TableCell className="text-center">{stat.totalHours.toFixed(1)} jam</TableCell>
                        <TableCell className="text-center">{stat.uniqueSubjects}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              stat.workloadLevel === 'rendah'
                                ? 'outline'
                                : stat.workloadLevel === 'sedang'
                                ? 'secondary'
                                : 'default'
                            }
                          >
                            {stat.workloadLevel.charAt(0).toUpperCase() + stat.workloadLevel.slice(1)}
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
                <h3 className="text-lg font-medium mb-2">Tidak ada data beban mengajar</h3>
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
            <BarChart className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Pilih Jadwal</h3>
            <p className="text-muted-foreground mb-4">
              Silakan pilih jadwal terlebih dahulu untuk melihat laporan beban mengajar guru
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TeacherLoadReport;