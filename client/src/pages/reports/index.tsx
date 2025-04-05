import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download } from 'lucide-react';
import { Link } from 'wouter';

const ReportsPage: React.FC = () => {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Laporan</h1>
          <p className="text-muted-foreground">Akses dan unduh laporan jadwal pelajaran</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Laporan Jadwal Guru
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Laporan jadwal mengajar untuk setiap guru berdasarkan periode
            </p>
            <Button variant="outline" className="w-full" disabled>
              <Download className="mr-2 h-4 w-4" />
              Segera Hadir
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Laporan Jadwal Kelas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Laporan jadwal pelajaran untuk setiap kelas berdasarkan periode
            </p>
            <Button variant="outline" className="w-full" disabled>
              <Download className="mr-2 h-4 w-4" />
              Segera Hadir
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Laporan Penggunaan Ruangan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Laporan penggunaan ruangan berdasarkan periode
            </p>
            <Button variant="outline" className="w-full" disabled>
              <Download className="mr-2 h-4 w-4" />
              Segera Hadir
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Halaman dalam Pengembangan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <FileText className="h-16 w-16 text-primary mb-4" />
            <h3 className="text-lg font-medium mb-2">Fitur Laporan</h3>
            <p className="text-muted-foreground mb-6">
              Fitur laporan sedang dalam tahap pengembangan. 
              Fitur ini akan segera tersedia di pembaruan berikutnya.
            </p>
            <Button asChild>
              <Link href="/">Kembali ke Dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsPage;