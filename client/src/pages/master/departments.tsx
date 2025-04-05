import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building } from 'lucide-react';
import { Link } from 'wouter';

const DepartmentsPage: React.FC = () => {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manajemen Jurusan</h1>
          <p className="text-muted-foreground">Kelola data jurusan dan program keahlian</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Halaman dalam Pengembangan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Building className="h-16 w-16 text-primary mb-4" />
            <h3 className="text-lg font-medium mb-2">Halaman Manajemen Jurusan</h3>
            <p className="text-muted-foreground mb-6">
              Halaman manajemen jurusan sedang dalam tahap pengembangan. 
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

export default DepartmentsPage;