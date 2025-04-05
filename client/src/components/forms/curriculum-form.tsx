import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { insertCurriculumSchema, Department, Subject } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';

// Extend the insertCurriculumSchema with validation rules
const formSchema = insertCurriculumSchema.extend({
  subjectId: z.coerce.number({
    required_error: "Mata pelajaran harus dipilih",
    invalid_type_error: "Mata pelajaran harus dipilih",
  }),
  departmentId: z.coerce.number({
    required_error: "Jurusan harus dipilih",
    invalid_type_error: "Jurusan harus dipilih",
  }),
  gradeLevel: z.coerce.number({
    required_error: "Tingkat kelas harus dipilih",
    invalid_type_error: "Tingkat kelas harus dipilih",
  }).min(10, "Tingkat kelas minimal 10").max(12, "Tingkat kelas maksimal 12"),
  hoursPerWeek: z.coerce.number({
    required_error: "Jam per minggu harus diisi",
    invalid_type_error: "Jam per minggu harus berupa angka",
  }).min(1, "Minimal 1 jam per minggu").max(10, "Maksimal 10 jam per minggu"),
  academicYear: z.string().min(4, "Tahun akademik harus diisi"),
});

type FormValues = z.infer<typeof formSchema>;

interface CurriculumFormProps {
  onSuccess: () => void;
  onError: (message: string) => void;
  defaultValues?: Partial<FormValues>;
  curriculumId?: number;
}

const CurriculumForm: React.FC<CurriculumFormProps> = ({ 
  onSuccess, 
  onError, 
  defaultValues = {
    subjectId: undefined,
    departmentId: undefined,
    gradeLevel: 10,
    hoursPerWeek: 2,
    academicYear: new Date().getFullYear() + '/' + (new Date().getFullYear() + 1),
  },
  curriculumId 
}) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | undefined>(
    defaultValues.departmentId
  );
  
  const [selectedGradeLevel, setSelectedGradeLevel] = useState<number | undefined>(
    defaultValues.gradeLevel
  );

  // Fetch departments
  const { data: departments } = useQuery<Department[]>({
    queryKey: ['/api/departments'],
  });

  // Fetch all subjects (for existing curriculum item)
  const { data: allSubjects } = useQuery<Subject[]>({
    queryKey: ['/api/subjects'],
    enabled: !!curriculumId,
  });

  // Fetch filtered subjects based on department and grade level
  const { data: filteredSubjects } = useQuery<Subject[]>({
    queryKey: ['/api/subjects', selectedDepartmentId ? selectedDepartmentId.toString() : 'none', selectedGradeLevel ? selectedGradeLevel.toString() : 'none'],
    enabled: !!selectedDepartmentId || !!selectedGradeLevel,
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (selectedDepartmentId) {
        params.append('departmentId', selectedDepartmentId.toString());
      }
      
      if (selectedGradeLevel) {
        params.append('gradeLevel', selectedGradeLevel.toString());
      }
      
      const response = await fetch(`/api/subjects?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Gagal memuat data mata pelajaran');
      }
      
      return await response.json();
    },
  });

  // Listen to department and grade level changes from form
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'departmentId') {
        const deptId = value.departmentId;
        setSelectedDepartmentId(typeof deptId === 'string' ? parseInt(deptId) : deptId);
      }
      if (name === 'gradeLevel') {
        const grade = value.gradeLevel;
        setSelectedGradeLevel(typeof grade === 'string' ? parseInt(grade) : grade);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form, form.watch]);

  const isEditMode = !!curriculumId;

  const onSubmit = async (data: FormValues) => {
    try {
      if (isEditMode) {
        await apiRequest('PUT', `/api/curriculum/${curriculumId}`, data);
      } else {
        await apiRequest('POST', '/api/curriculum', data);
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/curriculum'] });
      form.reset();
      onSuccess();
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Terjadi kesalahan');
    }
  };

  // Get list of subjects to show in dropdown
  const subjectsToShow = curriculumId ? allSubjects : filteredSubjects;

  const gradeLevelOptions = [
    { value: 10, label: 'X (Kelas 10)' },
    { value: 11, label: 'XI (Kelas 11)' },
    { value: 12, label: 'XII (Kelas 12)' },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="departmentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jurusan</FormLabel>
              <Select
                disabled={isEditMode}
                value={field.value?.toString() || ''}
                onValueChange={(value) => {
                  field.onChange(parseInt(value));
                  setSelectedDepartmentId(parseInt(value));
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jurusan" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {departments?.map((department) => (
                    <SelectItem key={department.id} value={department.id.toString()}>
                      {department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="gradeLevel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tingkat Kelas</FormLabel>
              <Select
                disabled={isEditMode}
                value={field.value?.toString() || ''}
                onValueChange={(value) => {
                  field.onChange(parseInt(value));
                  setSelectedGradeLevel(parseInt(value));
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tingkat kelas" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {gradeLevelOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="subjectId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mata Pelajaran</FormLabel>
              <Select
                disabled={(!subjectsToShow || subjectsToShow.length === 0) && !isEditMode}
                value={field.value?.toString() || ''}
                onValueChange={(value) => field.onChange(parseInt(value))}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih mata pelajaran" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {subjectsToShow?.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id.toString()}>
                      {subject.name} ({subject.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(!subjectsToShow || subjectsToShow.length === 0) && !isEditMode && (
                <FormDescription className="text-destructive">
                  Tidak ada mata pelajaran yang tersedia untuk jurusan dan tingkat kelas yang dipilih. 
                  Silahkan tambahkan mata pelajaran terlebih dahulu.
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="hoursPerWeek"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jam Per Minggu</FormLabel>
              <FormControl>
                <Input 
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || '')}
                />
              </FormControl>
              <FormDescription>
                Jumlah jam pelajaran per minggu untuk mata pelajaran ini
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="academicYear"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tahun Akademik</FormLabel>
              <FormControl>
                <Input placeholder="Contoh: 2024/2025" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={form.formState.isSubmitting || (!subjectsToShow || subjectsToShow.length === 0) && !isEditMode}
          >
            {form.formState.isSubmitting ? 'Menyimpan...' : isEditMode ? 'Perbarui' : 'Simpan'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CurriculumForm;