import React from 'react';
import { Link } from 'wouter';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, FileBarChart, FileText, LayoutGrid, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Schedule } from '@shared/schema';

const ReportMenu = () => {
  // Fetch schedules to check if we have any
  const { data: schedules } = useQuery<Schedule[]>({
    queryKey: ['/api/schedules'],
  });

  const hasSchedules = (schedules && schedules.length > 0) || false;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Laporan</h1>
        <p className="text-muted-foreground">
          Akses dan unduh berbagai laporan terkait jadwal pembelajaran
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Teacher Workload Report */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="text-xl">Beban Mengajar Guru</CardTitle>
              <Users className="h-6 w-6 text-primary/80" />
            </div>
            <CardDescription>
              Lihat analisis beban mengajar dan distribusi mata pelajaran untuk setiap guru
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Total jam mengajar per guru</li>
              <li>Distribusi mata pelajaran</li>
              <li>Distribusi kelas</li>
              <li>Ekspor data ke PDF</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button asChild disabled={!hasSchedules} className="w-full">
              <Link href="/reports/teacher-load-report">
                <FileText className="h-4 w-4 mr-2" />
                Buka Laporan
              </Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Room Usage Report */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="text-xl">Penggunaan Ruangan</CardTitle>
              <LayoutGrid className="h-6 w-6 text-primary/80" />
            </div>
            <CardDescription>
              Lihat analisis penggunaan dan pemanfaatan ruangan di seluruh periode jadwal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Tingkat penggunaan ruangan</li>
              <li>Distribusi penggunaan per jurusan</li>
              <li>Distribusi penggunaan per mata pelajaran</li>
              <li>Ekspor data ke PDF</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button asChild disabled={!hasSchedules} className="w-full">
              <Link href="/reports/room-usage-report">
                <FileText className="h-4 w-4 mr-2" />
                Buka Laporan
              </Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Conflict Report */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="text-xl">Jadwal Bentrok</CardTitle>
              <FileBarChart className="h-6 w-6 text-primary/80" />
            </div>
            <CardDescription>
              Lihat analisis konflik jadwal yang terjadi berdasarkan guru, kelas, dan ruangan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Konflik guru (jadwal bersamaan)</li>
              <li>Konflik kelas (jadwal bersamaan)</li>
              <li>Konflik ruangan (jadwal bersamaan)</li>
              <li>Ekspor data ke PDF</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button asChild disabled={!hasSchedules} className="w-full">
              <Link href="/reports/conflict-report">
                <FileText className="h-4 w-4 mr-2" />
                Buka Laporan
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      {!hasSchedules && (
        <Card className="bg-muted/40">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <ExternalLink className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="font-medium mb-1">Perlu Membuat Jadwal Terlebih Dahulu</h3>
                <p className="text-muted-foreground text-sm">
                  Untuk mengakses laporan-laporan ini, Anda perlu membuat jadwal terlebih dahulu. 
                  Buat jadwal baru melalui menu "Generate Jadwal".
                </p>
              </div>
              <Button asChild variant="outline" className="shrink-0">
                <Link href="/generate-schedule">
                  Buat Jadwal
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReportMenu;