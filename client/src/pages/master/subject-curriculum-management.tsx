import React, { useState, useMemo } from 'react';
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
  Clock, 
  Filter,
  CalendarRange
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Curriculum, Department, Subject, insertCurriculumSchema } from '@shared/schema';
import { queryClient, apiRequest } from '@/lib/queryClient';
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
import CurriculumForm from '@/components/forms/curriculum-form';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SubjectWithDetails extends Subject {
  department?: Department;
}

interface CurriculumWithDetails extends Curriculum {
  subject?: Subject;
  department?: Department;
}

const SubjectCurriculumPage: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('subjects');
  
  // State for Subjects
  const [isAddSubjectDialogOpen, setIsAddSubjectDialogOpen] = useState(false);
  const [isEditSubjectDialogOpen, setIsEditSubjectDialogOpen] = useState(false);
  const [isDeleteSubjectDialogOpen, setIsDeleteSubjectDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [filterDepartmentSubject, setFilterDepartmentSubject] = useState<string>('all');
  const [filterGradeLevelSubject, setFilterGradeLevelSubject] = useState<string>('all');
  const [searchQuerySubject, setSearchQuerySubject] = useState<string>('');
  
  // State for Curriculum
  const [isAddCurriculumDialogOpen, setIsAddCurriculumDialogOpen] = useState(false);
  const [isEditCurriculumDialogOpen, setIsEditCurriculumDialogOpen] = useState(false);
  const [isDeleteCurriculumDialogOpen, setIsDeleteCurriculumDialogOpen] = useState(false);
  const [selectedCurriculum, setSelectedCurriculum] = useState<Curriculum | null>(null);
  const [filterDepartmentCurriculum, setFilterDepartmentCurriculum] = useState<string>('all');
  const [filterGradeLevelCurriculum, setFilterGradeLevelCurriculum] = useState<string>('all');
  const [filterAcademicYear, setFilterAcademicYear] = useState<string>('all');
  const [searchQueryCurriculum, setSearchQueryCurriculum] = useState<string>('');
  
  // Get current academic year
  const currentYear = new Date().getFullYear();
  const defaultAcademicYear = `${currentYear}/${currentYear + 1}`;
  
  // Fetch departments for filters
  const { data: departments } = useQuery<Department[]>({
    queryKey: ['/api/departments'],
  });

  // ======== SUBJECTS MANAGEMENT ========
  
  // Fetch subjects with filters
  const { data: subjects, isLoading: isLoadingSubjects } = useQuery<SubjectWithDetails[]>({
    queryKey: ['/api/subjects', filterDepartmentSubject, filterGradeLevelSubject],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filterDepartmentSubject !== 'all') {
        params.append('departmentId', filterDepartmentSubject);
      }
      
      if (filterGradeLevelSubject !== 'all') {
        params.append('gradeLevel', filterGradeLevelSubject);
      }
      
      const response = await fetch(`/api/subjects?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Gagal memuat data mata pelajaran');
      }
      
      return await response.json();
    },
  });
  
  // Filtered subjects by search query
  const filteredSubjects = useMemo(() => {
    if (!subjects) return [];
    
    if (!searchQuerySubject) return subjects;
    
    return subjects.filter(subject => 
      subject.name.toLowerCase().includes(searchQuerySubject.toLowerCase()) ||
      subject.code.toLowerCase().includes(searchQuerySubject.toLowerCase())
    );
  }, [subjects, searchQuerySubject]);
  
  // Delete subject mutation
  const deleteSubjectMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/subjects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subjects'] });
      setIsDeleteSubjectDialogOpen(false);
      toast({
        title: 'Berhasil',
        description: 'Mata pelajaran berhasil dihapus',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Gagal menghapus mata pelajaran',
        description: error.message || 'Terjadi kesalahan',
        variant: 'destructive',
      });
    },
  });
  
  // Subject handlers
  const handleDeleteSubject = () => {
    if (selectedSubject) {
      deleteSubjectMutation.mutate(selectedSubject.id);
    }
  };
  
  const handleEditSubject = (subject: Subject) => {
    setSelectedSubject(subject);
    setIsEditSubjectDialogOpen(true);
  };
  
  const handleConfirmDeleteSubject = (subject: Subject) => {
    setSelectedSubject(subject);
    setIsDeleteSubjectDialogOpen(true);
  };
  
  // ======== CURRICULUM MANAGEMENT ========
  
  // Fetch curriculum with filters
  const { data: curriculum, isLoading: isLoadingCurriculum } = useQuery<CurriculumWithDetails[]>({
    queryKey: ['/api/curriculum', filterDepartmentCurriculum, filterGradeLevelCurriculum, filterAcademicYear],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filterDepartmentCurriculum !== 'all') {
        params.append('departmentId', filterDepartmentCurriculum);
      }
      
      if (filterGradeLevelCurriculum !== 'all') {
        params.append('gradeLevel', filterGradeLevelCurriculum);
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
  
  // Filtered curriculum by search query
  const filteredCurriculum = useMemo(() => {
    if (!curriculum) return [];
    
    if (!searchQueryCurriculum) return curriculum;
    
    return curriculum.filter(item => 
      item.subject?.name.toLowerCase().includes(searchQueryCurriculum.toLowerCase()) ||
      item.subject?.code.toLowerCase().includes(searchQueryCurriculum.toLowerCase()) ||
      item.department?.name.toLowerCase().includes(searchQueryCurriculum.toLowerCase())
    );
  }, [curriculum, searchQueryCurriculum]);
  
  // Delete curriculum mutation
  const deleteCurriculumMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/curriculum/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/curriculum'] });
      setIsDeleteCurriculumDialogOpen(false);
      toast({
        title: 'Berhasil',
        description: 'Item kurikulum berhasil dihapus',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Gagal menghapus item kurikulum',
        description: error.message || 'Terjadi kesalahan',
        variant: 'destructive',
      });
    },
  });
  
  // Curriculum handlers
  const handleDeleteCurriculum = () => {
    if (selectedCurriculum) {
      deleteCurriculumMutation.mutate(selectedCurriculum.id);
    }
  };
  
  const handleEditCurriculum = (curriculum: Curriculum) => {
    setSelectedCurriculum(curriculum);
    setIsEditCurriculumDialogOpen(true);
  };
  
  const handleConfirmDeleteCurriculum = (curriculum: Curriculum) => {
    setSelectedCurriculum(curriculum);
    setIsDeleteCurriculumDialogOpen(true);
  };
  
  // Quick add curriculum from subject handler
  const handleQuickAddToCurriculum = (subject: Subject) => {
    const initialValues = {
      subjectId: subject.id,
      departmentId: subject.departmentId || undefined,
      gradeLevel: subject.gradeLevel,
      hoursPerWeek: 2,
      academicYear: defaultAcademicYear,
    };
    
    // Pre-select the subject and set in form
    setSelectedSubject(subject);
    setIsAddCurriculumDialogOpen(true);
  };
  
  const gradeLevelOptions = [
    { value: 10, label: 'X (Kelas 10)' },
    { value: 11, label: 'XI (Kelas 11)' },
    { value: 12, label: 'XII (Kelas 12)' },
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold">Manajemen Mata Pelajaran & Kurikulum</CardTitle>
            <p className="text-sm text-muted-foreground">
              Kelola mata pelajaran dan pengaturan alokasi jam dalam kurikulum
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="subjects" className="flex gap-2 items-center">
                  <BookOpen className="w-4 h-4" />
                  <span>Mata Pelajaran</span>
                </TabsTrigger>
                <TabsTrigger value="curriculum" className="flex gap-2 items-center">
                  <GraduationCap className="w-4 h-4" />
                  <span>Kurikulum</span>
                </TabsTrigger>
              </TabsList>
              
              {activeTab === 'subjects' ? (
                <Button onClick={() => setIsAddSubjectDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Mata Pelajaran
                </Button>
              ) : (
                <Button onClick={() => setIsAddCurriculumDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Item Kurikulum
                </Button>
              )}
            </div>
            
            <TabsContent value="subjects" className="space-y-4">
              {/* Subjects Filter Section */}
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari mata pelajaran..."
                    className="pl-8"
                    value={searchQuerySubject}
                    onChange={(e) => setSearchQuerySubject(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Select
                    value={filterDepartmentSubject}
                    onValueChange={setFilterDepartmentSubject}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter Jurusan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Jurusan</SelectItem>
                      <SelectItem value="none">Umum (Tanpa Jurusan)</SelectItem>
                      {departments?.map((department) => (
                        <SelectItem key={department.id} value={department.id.toString()}>
                          {department.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select
                    value={filterGradeLevelSubject}
                    onValueChange={setFilterGradeLevelSubject}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter Kelas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Kelas</SelectItem>
                      {gradeLevelOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value.toString()}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Subjects Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kode</TableHead>
                      <TableHead>Nama Mata Pelajaran</TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead>Jurusan</TableHead>
                      <TableHead>Jenis</TableHead>
                      <TableHead>Tipe Ruangan</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingSubjects ? (
                      Array.from({ length: 5 }).map((_, index) => (
                        <TableRow key={index}>
                          <TableCell colSpan={7}>
                            <Skeleton className="h-10 w-full" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : filteredSubjects.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center h-24">
                          Tidak ada data mata pelajaran
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSubjects.map((subject) => (
                        <TableRow key={subject.id}>
                          <TableCell className="font-medium">{subject.code}</TableCell>
                          <TableCell>{subject.name}</TableCell>
                          <TableCell>
                            {gradeLevelOptions.find(gl => gl.value === subject.gradeLevel)?.label || subject.gradeLevel}
                          </TableCell>
                          <TableCell>
                            {subject.departmentId ? (
                              subject.department?.name || 'Loading...'
                            ) : (
                              <Badge variant="outline">Umum</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={subject.isCompulsory ? "default" : "secondary"}>
                              {subject.isCompulsory ? 'Wajib' : 'Pilihan'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={subject.roomType === 'teori' ? "outline" : "default"}>
                              {subject.roomType === 'teori' ? 'Teori' : 'Praktikum'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Buka menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditSubject(subject)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleQuickAddToCurriculum(subject)}>
                                  <GraduationCap className="mr-2 h-4 w-4" />
                                  Tambahkan ke Kurikulum
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleConfirmDeleteSubject(subject)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Hapus
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            <TabsContent value="curriculum" className="space-y-4">
              {/* Curriculum Filter Section */}
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari kurikulum..."
                    className="pl-8"
                    value={searchQueryCurriculum}
                    onChange={(e) => setSearchQueryCurriculum(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Select
                    value={filterDepartmentCurriculum}
                    onValueChange={setFilterDepartmentCurriculum}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter Jurusan" />
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
                  
                  <Select
                    value={filterGradeLevelCurriculum}
                    onValueChange={setFilterGradeLevelCurriculum}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter Kelas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Tingkat</SelectItem>
                      {gradeLevelOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value.toString()}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select
                    value={filterAcademicYear}
                    onValueChange={setFilterAcademicYear}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Tahun Ajaran" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Tahun</SelectItem>
                      <SelectItem value={defaultAcademicYear}>{defaultAcademicYear}</SelectItem>
                      <SelectItem value={`${currentYear-1}/${currentYear}`}>{`${currentYear-1}/${currentYear}`}</SelectItem>
                      <SelectItem value={`${currentYear+1}/${currentYear+2}`}>{`${currentYear+1}/${currentYear+2}`}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Curriculum Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mata Pelajaran</TableHead>
                      <TableHead>Kode</TableHead>
                      <TableHead>Jurusan</TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead>Jam/Minggu</TableHead>
                      <TableHead>Tahun Ajaran</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingCurriculum ? (
                      Array.from({ length: 5 }).map((_, index) => (
                        <TableRow key={index}>
                          <TableCell colSpan={7}>
                            <Skeleton className="h-10 w-full" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : filteredCurriculum.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center h-24">
                          Tidak ada data kurikulum
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCurriculum.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.subject?.name || 'Loading...'}</TableCell>
                          <TableCell>{item.subject?.code || 'Loading...'}</TableCell>
                          <TableCell>{item.department?.name || 'Loading...'}</TableCell>
                          <TableCell>
                            {gradeLevelOptions.find(gl => gl.value === item.gradeLevel)?.label || item.gradeLevel}
                          </TableCell>
                          <TableCell>
                            <Badge>
                              <Clock className="h-3 w-3 mr-1" />
                              {item.hoursPerWeek} JP
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              <CalendarRange className="h-3 w-3 mr-1" />
                              {item.academicYear}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Buka menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditCurriculum(item)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleConfirmDeleteCurriculum(item)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Hapus
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Subject Dialogs */}
      <Dialog open={isAddSubjectDialogOpen} onOpenChange={setIsAddSubjectDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Tambah Mata Pelajaran Baru</DialogTitle>
          </DialogHeader>
          <SubjectForm
            onSuccess={() => {
              setIsAddSubjectDialogOpen(false);
              toast({
                title: 'Berhasil',
                description: 'Mata pelajaran berhasil ditambahkan',
              });
            }}
            onError={(message) => {
              toast({
                title: 'Gagal menambahkan mata pelajaran',
                description: message,
                variant: 'destructive',
              });
            }}
          />
        </DialogContent>
      </Dialog>
      
      <Dialog open={isEditSubjectDialogOpen} onOpenChange={setIsEditSubjectDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Mata Pelajaran</DialogTitle>
          </DialogHeader>
          {selectedSubject && (
            <SubjectForm
              onSuccess={() => {
                setIsEditSubjectDialogOpen(false);
                toast({
                  title: 'Berhasil',
                  description: 'Mata pelajaran berhasil diperbarui',
                });
              }}
              onError={(message) => {
                toast({
                  title: 'Gagal memperbarui mata pelajaran',
                  description: message,
                  variant: 'destructive',
                });
              }}
              defaultValues={{
                id: selectedSubject.id,
                name: selectedSubject.name,
                code: selectedSubject.code,
                gradeLevel: selectedSubject.gradeLevel,
                description: selectedSubject.description || undefined,
                departmentId: selectedSubject.departmentId || undefined,
                roomType: selectedSubject.roomType,
                isCompulsory: selectedSubject.isCompulsory
              }}
              subjectId={selectedSubject.id}
            />
          )}
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteSubjectDialogOpen} onOpenChange={setIsDeleteSubjectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Mata Pelajaran</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus mata pelajaran ini? Tindakan ini tidak dapat dibatalkan
              dan akan menghapus semua data kurikulum yang terkait.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteSubject} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Curriculum Dialogs */}
      <Dialog open={isAddCurriculumDialogOpen} onOpenChange={setIsAddCurriculumDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Tambah Item Kurikulum</DialogTitle>
          </DialogHeader>
          <CurriculumForm
            onSuccess={() => {
              setIsAddCurriculumDialogOpen(false);
              toast({
                title: 'Berhasil',
                description: 'Item kurikulum berhasil ditambahkan',
              });
            }}
            onError={(message) => {
              toast({
                title: 'Gagal menambahkan item kurikulum',
                description: message,
                variant: 'destructive',
              });
            }}
            defaultValues={selectedSubject ? {
              subjectId: selectedSubject.id,
              departmentId: selectedSubject.departmentId || undefined,
              gradeLevel: selectedSubject.gradeLevel,
              hoursPerWeek: 2,
              academicYear: defaultAcademicYear,
            } : undefined}
          />
        </DialogContent>
      </Dialog>
      
      <Dialog open={isEditCurriculumDialogOpen} onOpenChange={setIsEditCurriculumDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Item Kurikulum</DialogTitle>
          </DialogHeader>
          {selectedCurriculum && (
            <CurriculumForm
              onSuccess={() => {
                setIsEditCurriculumDialogOpen(false);
                toast({
                  title: 'Berhasil',
                  description: 'Item kurikulum berhasil diperbarui',
                });
              }}
              onError={(message) => {
                toast({
                  title: 'Gagal memperbarui item kurikulum',
                  description: message,
                  variant: 'destructive',
                });
              }}
              defaultValues={selectedCurriculum}
              curriculumId={selectedCurriculum.id}
            />
          )}
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteCurriculumDialogOpen} onOpenChange={setIsDeleteCurriculumDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Item Kurikulum</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus item kurikulum ini? 
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteCurriculum} 
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

export default SubjectCurriculumPage;