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
  Clock 
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Curriculum, Department, Subject } from '@shared/schema';
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
import CurriculumForm from '@/components/forms/curriculum-form';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CurriculumWithDetails extends Curriculum {
  subject?: Subject;
  department?: Department;
}

const CurriculumPage: React.FC = () => {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCurriculum, setSelectedCurriculum] = useState<Curriculum | null>(null);
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterGradeLevel, setFilterGradeLevel] = useState<string>('all');
  const [filterAcademicYear, setFilterAcademicYear] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState('all');
  
  // Get current academic year
  const currentYear = new Date().getFullYear();
  const defaultAcademicYear = `${currentYear}/${currentYear + 1}`;
  
  // Fetch curriculum with filters
  const { data: curriculumItems, isLoading } = useQuery<CurriculumWithDetails[]>({
    queryKey: ['/api/curriculum', filterDepartment, filterGradeLevel, filterAcademicYear, activeTab],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filterDepartment !== 'all') {
        params.append('departmentId', filterDepartment);
      }
      
      if (filterGradeLevel !== 'all') {
        params.append('gradeLevel', filterGradeLevel);
      }
      
      if (filterAcademicYear !== 'all') {
        params.append('academicYear', filterAcademicYear);
      }
      
      const response = await fetch(`/api/curriculum?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Gagal memuat data kurikulum');
      }
      
      return await response.json();
    },
  });
  
  // Fetch departments for filter
  const { data: departments } = useQuery<Department[]>({
    queryKey: ['/api/departments'],
  });
  
  // Fetch subjects for details
  const { data: subjects } = useQuery<Subject[]>({
    queryKey: ['/api/subjects'],
  });
  
  // Delete curriculum mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/curriculum/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Gagal menghapus kurikulum');
      }
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/curriculum'] });
      setIsDeleteDialogOpen(false);
      toast({
        title: 'Kurikulum dihapus',
        description: 'Data kurikulum telah berhasil dihapus',
        variant: 'success',
      });
    },
    onError: (error) => {
      toast({
        title: 'Gagal menghapus kurikulum',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
        variant: 'destructive',
      });
    },
  });

  const handleDelete = (curriculum: Curriculum) => {
    setSelectedCurriculum(curriculum);
    setIsDeleteDialogOpen(true);
  };

  const handleEdit = (curriculum: Curriculum) => {
    setSelectedCurriculum(curriculum);
    setIsEditDialogOpen(true);
  };

  const handleAddSuccess = () => {
    setIsAddDialogOpen(false);
    toast({
      title: 'Kurikulum Ditambahkan',
      description: 'Data kurikulum telah berhasil ditambahkan',
      variant: 'success',
    });
  };

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
    toast({
      title: 'Kurikulum Diperbarui',
      description: 'Data kurikulum telah berhasil diperbarui',
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
    if (selectedCurriculum) {
      deleteMutation.mutate(selectedCurriculum.id);
    }
  };

  const resetFilters = () => {
    setFilterDepartment('all');
    setFilterGradeLevel('all');
    setFilterAcademicYear('all');
    setSearchQuery('');
  };

  // Extract unique academic years from curriculum
  const academicYears = curriculumItems 
    ? curriculumItems
        .map(item => item.academicYear)
        .filter((year, index, self) => self.indexOf(year) === index)
    : [];
  
  // Function to get grade level name
  const getGradeLevelName = (gradeLevel: number) => {
    switch (gradeLevel) {
      case 10: return 'X';
      case 11: return 'XI';
      case 12: return 'XII';
      default: return gradeLevel.toString();
    }
  };
  
  // Filter curriculum items based on search query and tab
  const filteredCurriculum = curriculumItems
    ?.filter(curriculum => {
      if (searchQuery) {
        const subjectName = subjects?.find(s => s.id === curriculum.subjectId)?.name?.toLowerCase() || '';
        const departmentName = departments?.find(d => d.id === curriculum.departmentId)?.name?.toLowerCase() || '';
        return (
          subjectName.includes(searchQuery.toLowerCase()) ||
          departmentName.includes(searchQuery.toLowerCase())
        );
      }
      return true;
    })
    .filter(curriculum => {
      // Additional filter for tab view
      if (activeTab === 'all') {
        return true;
      }
      return curriculum.academicYear === activeTab;
    });
  
  // Group curriculum by grade level and department
  const groupedCurriculum = filteredCurriculum?.reduce<Record<string, Record<string, CurriculumWithDetails[]>>>((acc, item) => {
    const departmentId = item.departmentId.toString();
    const gradeLevel = item.gradeLevel.toString();
    
    if (!acc[departmentId]) {
      acc[departmentId] = {};
    }
    
    if (!acc[departmentId][gradeLevel]) {
      acc[departmentId][gradeLevel] = [];
    }
    
    // Find subject and department details
    const subject = subjects?.find(s => s.id === item.subjectId);
    const department = departments?.find(d => d.id === item.departmentId);
    
    // Add details to curriculum item
    const itemWithDetails = {
      ...item,
      subject,
      department
    };
    
    acc[departmentId][gradeLevel].push(itemWithDetails);
    
    return acc;
  }, {});

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manajemen Kurikulum</h1>
          <p className="text-muted-foreground">Kelola data kurikulum untuk semua jurusan dan kelas</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Kurikulum
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Tambah Kurikulum Baru</DialogTitle>
            </DialogHeader>
            <CurriculumForm
              onSuccess={handleAddSuccess}
              onError={handleFormError}
              defaultValues={{
                academicYear: defaultAcademicYear
              }}
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
                  placeholder="Cari mata pelajaran atau jurusan..."
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
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
          <TabsTrigger value="all">Semua Tahun</TabsTrigger>
          {academicYears.slice(0, 4).map(year => (
            <TabsTrigger key={year} value={year}>
              {year}
            </TabsTrigger>
          ))}
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
          ) : filteredCurriculum && filteredCurriculum.length > 0 ? (
            <div className="space-y-6">
              {groupedCurriculum && Object.entries(groupedCurriculum).map(([departmentId, gradeLevels]) => {
                const department = departments?.find(d => d.id === parseInt(departmentId));
                
                return (
                  <Card key={departmentId}>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <GraduationCap className="h-5 w-5 mr-2" />
                        {department?.name || 'Jurusan Tidak Ditemukan'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {Object.entries(gradeLevels).map(([gradeLevel, items]) => (
                          <div key={gradeLevel} className="space-y-2">
                            <h3 className="text-md font-semibold">
                              Kelas {getGradeLevelName(parseInt(gradeLevel))}
                            </h3>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Mata Pelajaran</TableHead>
                                  <TableHead>Jam/Minggu</TableHead>
                                  <TableHead>Tahun Akademik</TableHead>
                                  <TableHead className="w-[100px]">Aksi</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {items.map((item) => (
                                  <TableRow key={item.id}>
                                    <TableCell>
                                      {item.subject?.name || `Mata pelajaran ${item.subjectId}`}
                                      <div className="text-xs text-muted-foreground">
                                        Kode: {item.subject?.code || '-'}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center">
                                        <Clock className="h-3 w-3 mr-1" />
                                        {item.hoursPerWeek} jam
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline">
                                        {item.academicYear}
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
                                          <DropdownMenuItem onClick={() => handleEdit(item)}>
                                            <Pencil className="mr-2 h-4 w-4" />
                                            Edit
                                          </DropdownMenuItem>
                                          <DropdownMenuItem 
                                            className="text-destructive focus:text-destructive"
                                            onClick={() => handleDelete(item)}
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
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Belum ada data kurikulum</h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery || filterDepartment !== 'all' || filterGradeLevel !== 'all' 
                    ? 'Tidak ada kurikulum yang sesuai dengan filter yang dipilih.' 
                    : 'Anda belum memiliki data kurikulum. Silahkan tambahkan data kurikulum baru.'}
                </p>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Kurikulum
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
            <DialogTitle>Edit Kurikulum</DialogTitle>
          </DialogHeader>
          {selectedCurriculum && (
            <CurriculumForm
              onSuccess={handleEditSuccess}
              onError={handleFormError}
              defaultValues={selectedCurriculum}
              curriculumId={selectedCurriculum.id}
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
              Apakah Anda yakin ingin menghapus kurikulum ini? 
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

export default CurriculumPage;