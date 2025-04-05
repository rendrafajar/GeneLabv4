import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Plus, Pencil, Trash2, MoreHorizontal, Search, CalendarRange, School } from 'lucide-react';
import { Link } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Class, Department } from '@shared/schema';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import ClassForm from '@/components/forms/class-form';
import { Skeleton } from '@/components/ui/skeleton';

const ClassesPage: React.FC = () => {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [filterDepartmentId, setFilterDepartmentId] = useState<string>('');
  const [filterAcademicYear, setFilterAcademicYear] = useState<string>('');
  const [filterActive, setFilterActive] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Fetch departments for filter
  const { data: departments } = useQuery<Department[]>({
    queryKey: ['/api/departments'],
  });
  
  // Fetch classes with filters
  const { data: classes, isLoading } = useQuery<Class[]>({
    queryKey: ['/api/classes', filterDepartmentId, filterAcademicYear, filterActive, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filterDepartmentId) {
        params.append('departmentId', filterDepartmentId);
      }
      
      if (filterAcademicYear) {
        params.append('academicYear', filterAcademicYear);
      }
      
      if (filterActive !== 'all') {
        params.append('isActive', filterActive === 'active' ? 'true' : 'false');
      }
      
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      
      const response = await fetch(`/api/classes?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Gagal memuat data kelas');
      }
      
      return await response.json();
    },
  });
  
  // Delete class mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/classes/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Gagal menghapus kelas');
      }
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/classes'] });
      setIsDeleteDialogOpen(false);
      toast({
        title: 'Kelas dihapus',
        description: 'Data kelas telah berhasil dihapus',
        variant: 'success',
      });
    },
    onError: (error) => {
      toast({
        title: 'Gagal menghapus kelas',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
        variant: 'destructive',
      });
    },
  });

  // Get unique academic years for filter
  const academicYears = React.useMemo(() => {
    if (!classes) return [];
    const years = new Set(classes.map(c => c.academicYear));
    return Array.from(years);
  }, [classes]);

  // Get department for a class
  const getDepartmentName = (departmentId: number) => {
    const department = departments?.find(d => d.id === departmentId);
    return department?.name || '-';
  };

  const getGradeLevelName = (gradeLevel: number) => {
    switch (gradeLevel) {
      case 10: return 'X (Kelas 10)';
      case 11: return 'XI (Kelas 11)';
      case 12: return 'XII (Kelas 12)';
      default: return `Kelas ${gradeLevel}`;
    }
  };

  const handleDelete = (classItem: Class) => {
    setSelectedClass(classItem);
    setIsDeleteDialogOpen(true);
  };

  const handleEdit = (classItem: Class) => {
    setSelectedClass(classItem);
    setIsEditDialogOpen(true);
  };

  const handleAddSuccess = () => {
    setIsAddDialogOpen(false);
    toast({
      title: 'Kelas Ditambahkan',
      description: 'Data kelas telah berhasil ditambahkan',
      variant: 'success',
    });
  };

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
    toast({
      title: 'Kelas Diperbarui',
      description: 'Data kelas telah berhasil diperbarui',
      variant: 'success',
    });
  };

  const handleFormError = (message: string) => {
    toast({
      title: 'Gagal Menyimpan Data',
      description: message,
      variant: 'destructive',
    });
  };

  const confirmDelete = () => {
    if (selectedClass) {
      deleteMutation.mutate(selectedClass.id);
    }
  };

  const resetFilters = () => {
    setFilterDepartmentId('');
    setFilterAcademicYear('');
    setFilterActive('all');
    setSearchQuery('');
  };

  const filteredClasses = classes?.filter(classItem => {
    if (searchQuery) {
      return classItem.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manajemen Kelas</h1>
          <p className="text-muted-foreground">Kelola data kelas dan tingkatan</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Kelas
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Tambah Kelas Baru</DialogTitle>
            </DialogHeader>
            <ClassForm
              onSuccess={handleAddSuccess}
              onError={handleFormError}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Filter dan Pencarian</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Pencarian</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Cari nama kelas..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Jurusan</label>
              <Select value={filterDepartmentId} onValueChange={setFilterDepartmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Jurusan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua Jurusan</SelectItem>
                  {departments?.map((department) => (
                    <SelectItem key={department.id} value={department.id.toString()}>
                      {department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Tahun Ajaran</label>
              <Select value={filterAcademicYear} onValueChange={setFilterAcademicYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Tahun" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua Tahun</SelectItem>
                  {academicYears.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={filterActive} onValueChange={setFilterActive}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Tidak Aktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={resetFilters} size="sm">
              Reset Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Kelas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          ) : filteredClasses && filteredClasses.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Kelas</TableHead>
                  <TableHead>Tingkat</TableHead>
                  <TableHead>Jurusan</TableHead>
                  <TableHead>Tahun Ajaran</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClasses.map((classItem) => (
                  <TableRow key={classItem.id}>
                    <TableCell className="font-medium">{classItem.name}</TableCell>
                    <TableCell>{getGradeLevelName(classItem.gradeLevel)}</TableCell>
                    <TableCell>{getDepartmentName(classItem.departmentId)}</TableCell>
                    <TableCell>{classItem.academicYear}</TableCell>
                    <TableCell>
                      <Badge variant={classItem.isActive ? "success" : "secondary"}>
                        {classItem.isActive ? 'Aktif' : 'Non-Aktif'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Aksi</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(classItem)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDelete(classItem)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <School className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Belum ada data kelas</h3>
              <p className="text-muted-foreground mb-6">
                Anda belum memiliki data kelas. Silahkan tambahkan data kelas baru.
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Kelas
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Kelas</DialogTitle>
          </DialogHeader>
          {selectedClass && (
            <ClassForm
              onSuccess={handleEditSuccess}
              onError={handleFormError}
              defaultValues={selectedClass}
              classId={selectedClass.id}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus kelas "{selectedClass?.name}"? 
              Tindakan ini tidak dapat dibatalkan dan akan menghapus semua data terkait.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ClassesPage;