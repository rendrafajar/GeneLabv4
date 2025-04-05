import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Plus, 
  Pencil, 
  Trash2, 
  MoreHorizontal, 
  Search, 
  GraduationCap,
  Filter 
} from 'lucide-react';
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
  DropdownMenuSeparator,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Extended subject type with department relationship and fixed types
interface SubjectWithDepartment {
  id: number;
  name: string;
  code: string;
  gradeLevel: number;
  departmentId: number | null;
  description: string | null;
  roomType: 'teori' | 'praktikum';
  isCompulsory: boolean;
  department?: Department;
}

const SubjectsPage: React.FC = () => {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<SubjectWithDepartment | null>(null);
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterGradeLevel, setFilterGradeLevel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState('all');
  
  // Fetch subjects with filters
  const { data: subjects, isLoading } = useQuery<SubjectWithDepartment[]>({
    queryKey: ['/api/subjects', filterDepartment, filterGradeLevel],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filterDepartment !== 'all') {
        params.append('departmentId', filterDepartment);
      }
      
      if (filterGradeLevel !== 'all') {
        params.append('gradeLevel', filterGradeLevel);
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

  const handleDelete = (subject: SubjectWithDepartment) => {
    setSelectedSubject(subject);
    setIsDeleteDialogOpen(true);
  };

  const handleEdit = (subject: SubjectWithDepartment) => {
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
    setSearchQuery('');
    setActiveTab('all');
  };

  // Function to get grade level name
  const getGradeLevelName = (gradeLevel: number) => {
    switch (gradeLevel) {
      case 10: return 'X (Kelas 10)';
      case 11: return 'XI (Kelas 11)';
      case 12: return 'XII (Kelas 12)';
      default: return `Kelas ${gradeLevel}`;
    }
  };
  
  // Filter subjects based on search query and tab
  const filteredSubjects = subjects
    ?.filter(subject => {
      if (searchQuery) {
        return (
          subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          subject.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (subject.description && subject.description.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      }
      return true;
    })
    .filter(subject => {
      // Filter based on tab
      if (activeTab === 'all') {
        return true;
      } else if (activeTab === 'generic') {
        return subject.departmentId === null || subject.departmentId === undefined;
      } else if (activeTab === 'departmental') {
        return subject.departmentId !== null && subject.departmentId !== undefined;
      } else if (activeTab === 'compulsory') {
        return subject.isCompulsory === true;
      } else if (activeTab === 'optional') {
        return subject.isCompulsory === false;
      }
      return true;
    });

  // Group subjects by grade level
  const groupedSubjects = filteredSubjects?.reduce((acc, subject) => {
    const gradeLevel = subject.gradeLevel;
    if (!acc[gradeLevel]) {
      acc[gradeLevel] = [];
    }
    
    // Find department details
    const department = departments?.find(d => d.id === subject.departmentId);
    
    // Add department details to subject
    const subjectWithDepartment = {
      ...subject,
      department
    };
    
    acc[gradeLevel].push(subjectWithDepartment);
    return acc;
  }, {} as Record<number, SubjectWithDepartment[]>);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manajemen Mata Pelajaran</h1>
          <p className="text-muted-foreground">Kelola data mata pelajaran untuk kurikulum sekolah</p>
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
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filter dan Pencarian
          </CardTitle>
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
              <label className="text-sm font-medium mb-2 block">Jurusan</label>
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Jurusan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Jurusan</SelectItem>
                  <SelectItem value="null">Mata Pelajaran Umum</SelectItem>
                  {departments?.map((department) => (
                    <SelectItem key={department.id} value={department.id.toString()}>
                      {department.name}
                    </SelectItem>
                  ))}
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
          <TabsTrigger value="all">Semua</TabsTrigger>
          <TabsTrigger value="generic">Umum</TabsTrigger>
          <TabsTrigger value="departmental">Jurusan</TabsTrigger>
          <TabsTrigger value="compulsory">Wajib</TabsTrigger>
          <TabsTrigger value="optional">Pilihan</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="space-y-4">
              {Array(3).fill(0).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-40" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Array(4).fill(0).map((_, j) => (
                        <Skeleton key={j} className="h-12 w-full" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredSubjects && filteredSubjects.length > 0 ? (
            <div className="space-y-6">
              {groupedSubjects && Object.entries(groupedSubjects).sort((a, b) => parseInt(a[0]) - parseInt(b[0])).map(([gradeLevel, items]) => (
                <Card key={gradeLevel}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <GraduationCap className="h-5 w-5 mr-2" />
                      {getGradeLevelName(parseInt(gradeLevel))}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[150px]">Kode</TableHead>
                          <TableHead>Nama Mata Pelajaran</TableHead>
                          <TableHead>Jenis</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-[100px]">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((subject) => (
                          <TableRow key={subject.id}>
                            <TableCell className="font-medium">{subject.code}</TableCell>
                            <TableCell>
                              {subject.name}
                              {subject.description && (
                                <div className="text-xs text-muted-foreground mt-1 max-w-xs truncate">
                                  {subject.description}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {subject.departmentId ? (
                                <Badge variant="outline" className="bg-primary/10">
                                  {subject.department?.name || 'Jurusan'}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-secondary/10">
                                  Umum
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {subject.isCompulsory ? (
                                <Badge>Wajib</Badge>
                              ) : (
                                <Badge variant="outline">Pilihan</Badge>
                              )}
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
                                  <DropdownMenuSeparator />
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
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Belum ada data mata pelajaran</h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery || filterDepartment !== 'all' || filterGradeLevel !== 'all' 
                    ? 'Tidak ada mata pelajaran yang sesuai dengan filter yang dipilih.' 
                    : 'Anda belum memiliki data mata pelajaran. Silahkan tambahkan data mata pelajaran baru.'}
                </p>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Mata Pelajaran
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

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
                id: selectedSubject.id,
                name: selectedSubject.name,
                code: selectedSubject.code,
                gradeLevel: selectedSubject.gradeLevel,
                departmentId: selectedSubject.departmentId || undefined,
                description: selectedSubject.description || '',
                roomType: selectedSubject.roomType,
                isCompulsory: selectedSubject.isCompulsory !== undefined ? selectedSubject.isCompulsory : true
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
              Apakah Anda yakin ingin menghapus mata pelajaran <strong>"{selectedSubject?.name}"</strong>? 
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