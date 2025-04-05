import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Book, Plus, Pencil, Trash2, MoreHorizontal, Search, Beaker } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Subject, Department } from '@shared/schema';
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
import SubjectForm from '@/components/forms/subject-form';
import { Skeleton } from '@/components/ui/skeleton';

const SubjectsPage: React.FC = () => {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterGradeLevel, setFilterGradeLevel] = useState<string>('all');
  const [filterRoomType, setFilterRoomType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Fetch subjects with filters
  const { data: subjects, isLoading } = useQuery<Subject[]>({
    queryKey: ['/api/subjects', filterDepartment, filterGradeLevel, filterRoomType, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filterDepartment !== 'all') {
        params.append('departmentId', filterDepartment);
      }
      
      if (filterGradeLevel !== 'all') {
        params.append('gradeLevel', filterGradeLevel);
      }
      
      if (filterRoomType !== 'all') {
        params.append('roomType', filterRoomType);
      }
      
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      
      const response = await fetch(`/api/subjects?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Gagal memuat data mata pelajaran');
      }
      
      return await response.json();
    },
  });
  
  // Fetch departments for filter
  const { data: departments } = useQuery<Department[]>({
    queryKey: ['/api/departments'],
  });
  
  // Delete subject mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/subjects/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Gagal menghapus mata pelajaran');
      }
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subjects'] });
      setIsDeleteDialogOpen(false);
      toast({
        title: 'Mata pelajaran dihapus',
        description: 'Data mata pelajaran telah berhasil dihapus',
        variant: 'success',
      });
    },
    onError: (error) => {
      toast({
        title: 'Gagal menghapus mata pelajaran',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
        variant: 'destructive',
      });
    },
  });

  const handleDelete = (subject: Subject) => {
    setSelectedSubject(subject);
    setIsDeleteDialogOpen(true);
  };

  const handleEdit = (subject: Subject) => {
    setSelectedSubject(subject);
    setIsEditDialogOpen(true);
  };

  const handleAddSuccess = () => {
    setIsAddDialogOpen(false);
    toast({
      title: 'Mata Pelajaran Ditambahkan',
      description: 'Data mata pelajaran telah berhasil ditambahkan',
      variant: 'success',
    });
  };

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
    toast({
      title: 'Mata Pelajaran Diperbarui',
      description: 'Data mata pelajaran telah berhasil diperbarui',
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
    if (selectedSubject) {
      deleteMutation.mutate(selectedSubject.id);
    }
  };

  const resetFilters = () => {
    setFilterDepartment('all');
    setFilterGradeLevel('all');
    setFilterRoomType('all');
    setSearchQuery('');
  };

  const filteredSubjects = subjects?.filter(subject => {
    if (searchQuery) {
      return (
        subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subject.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (subject.description && subject.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    return true;
  });

  const getDepartmentName = (departmentId: number | null) => {
    if (!departmentId) return 'Semua Jurusan';
    const department = departments?.find(d => d.id === departmentId);
    return department ? department.name : '-';
  };

  const getGradeLevelName = (gradeLevel: number | null) => {
    if (!gradeLevel) return 'Semua Tingkatan';
    
    switch (gradeLevel) {
      case 10: return 'X (Kelas 10)';
      case 11: return 'XI (Kelas 11)';
      case 12: return 'XII (Kelas 12)';
      default: return 'Tidak Diketahui';
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manajemen Mata Pelajaran</h1>
          <p className="text-muted-foreground">Kelola data mata pelajaran dan jenis ruangan yang diperlukan</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Mata Pelajaran
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Tambah Mata Pelajaran Baru</DialogTitle>
            </DialogHeader>
            <SubjectForm
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
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-2 block">Pencarian</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Cari nama atau kode mata pelajaran..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Tingkat Kelas</label>
              <Select value={filterGradeLevel} onValueChange={setFilterGradeLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Tingkatan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tingkatan</SelectItem>
                  <SelectItem value="10">X (Kelas 10)</SelectItem>
                  <SelectItem value="11">XI (Kelas 11)</SelectItem>
                  <SelectItem value="12">XII (Kelas 12)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Jenis Ruangan</label>
              <Select value={filterRoomType} onValueChange={setFilterRoomType}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Jenis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Jenis</SelectItem>
                  <SelectItem value="teori">Kelas Teori</SelectItem>
                  <SelectItem value="praktikum">Lab/Praktikum</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-2 block">Jurusan</label>
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Jurusan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Jurusan</SelectItem>
                  {departments?.map((department) => (
                    <SelectItem key={department.id} value={department.id.toString()}>
                      {department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="md:col-span-2 flex items-end">
              <Button variant="outline" onClick={resetFilters} size="sm" className="ml-auto">
                Reset Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Mata Pelajaran</CardTitle>
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
          ) : filteredSubjects && filteredSubjects.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Nama Mata Pelajaran</TableHead>
                  <TableHead>Tingkat</TableHead>
                  <TableHead>Jurusan</TableHead>
                  <TableHead>Jenis Ruangan</TableHead>
                  <TableHead className="w-[100px]">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubjects.map((subject) => (
                  <TableRow key={subject.id}>
                    <TableCell className="font-medium">{subject.code}</TableCell>
                    <TableCell>{subject.name}</TableCell>
                    <TableCell>{getGradeLevelName(subject.gradeLevel)}</TableCell>
                    <TableCell>{getDepartmentName(subject.departmentId)}</TableCell>
                    <TableCell>
                      <Badge variant={subject.roomType === 'praktikum' ? "default" : "outline"}>
                        {subject.roomType === 'praktikum' ? (
                          <span className="flex items-center">
                            <Beaker className="h-3 w-3 mr-1" /> Praktikum
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <Book className="h-3 w-3 mr-1" /> Teori
                          </span>
                        )}
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
                          <DropdownMenuItem onClick={() => handleEdit(subject)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDelete(subject)}
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
              <Book className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Belum ada data mata pelajaran</h3>
              <p className="text-muted-foreground mb-6">
                Anda belum memiliki data mata pelajaran. Silahkan tambahkan data mata pelajaran baru.
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Mata Pelajaran
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Mata Pelajaran</DialogTitle>
          </DialogHeader>
          {selectedSubject && (
            <SubjectForm
              onSuccess={handleEditSuccess}
              onError={handleFormError}
              defaultValues={{
                ...selectedSubject,
                description: selectedSubject.description || '',
              }}
              subjectId={selectedSubject.id}
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
              Apakah Anda yakin ingin menghapus mata pelajaran "{selectedSubject?.name}"? 
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

export default SubjectsPage;