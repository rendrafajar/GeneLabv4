import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { insertSubjectSchema, Department } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';

// Extend the insertSubjectSchema with validation rules
const formSchema = insertSubjectSchema.extend({
  name: z.string().min(2, 'Nama mata pelajaran minimal 2 karakter'),
  code: z.string().min(2, 'Kode mata pelajaran minimal 2 karakter').max(10, 'Kode mata pelajaran maksimal 10 karakter'),
  gradeLevel: z.coerce.number().nullable(),
  departmentId: z.coerce.number().nullable(),
  roomType: z.enum(['teori', 'praktikum']),
  description: z.string().optional().transform(v => v === null ? '' : v),
});

type FormValues = z.infer<typeof formSchema>;

interface SubjectFormProps {
  onSuccess: () => void;
  onError: (message: string) => void;
  defaultValues?: Partial<FormValues>;
  subjectId?: number;
}

const SubjectForm: React.FC<SubjectFormProps> = ({ 
  onSuccess, 
  onError, 
  defaultValues = {
    name: '',
    code: '',
    gradeLevel: null,
    departmentId: null,
    roomType: 'teori',
    description: '',
  },
  subjectId 
}) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...defaultValues,
      description: defaultValues.description || '',
    },
  });

  const { data: departments } = useQuery<Department[]>({
    queryKey: ['/api/departments'],
  });

  const isEditMode = !!subjectId;

  const onSubmit = async (data: FormValues) => {
    try {
      if (isEditMode) {
        await apiRequest('PUT', `/api/subjects/${subjectId}`, data);
      } else {
        await apiRequest('POST', '/api/subjects', data);
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/subjects'] });
      form.reset();
      onSuccess();
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Terjadi kesalahan');
    }
  };

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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Mata Pelajaran</FormLabel>
              <FormControl>
                <Input placeholder="Masukkan nama mata pelajaran" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kode Mata Pelajaran</FormLabel>
              <FormControl>
                <Input placeholder="Masukkan kode mata pelajaran" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="gradeLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tingkat Kelas (Opsional)</FormLabel>
                <Select
                  value={field.value !== null ? field.value.toString() : ""}
                  onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Semua tingkatan" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">Semua tingkatan</SelectItem>
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
            name="departmentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Jurusan (Opsional)</FormLabel>
                <Select
                  value={field.value !== null ? field.value.toString() : ""}
                  onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Semua jurusan" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">Semua jurusan</SelectItem>
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
        </div>
        
        <FormField
          control={form.control}
          name="roomType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jenis Ruangan</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis ruangan" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="teori">Teori (Kelas Biasa)</SelectItem>
                  <SelectItem value="praktikum">Praktikum (Lab/Workshop)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deskripsi</FormLabel>
              <FormControl>
                <Textarea placeholder="Deskripsi mata pelajaran (opsional)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Menyimpan...' : isEditMode ? 'Perbarui' : 'Simpan'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default SubjectForm;