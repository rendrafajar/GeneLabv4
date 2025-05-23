import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { insertClassSchema, Department } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';

// Extend the insertClassSchema with validation rules
const formSchema = insertClassSchema.extend({
  name: z.string().min(2, 'Nama kelas minimal 2 karakter'),
  gradeLevel: z.coerce.number().min(10, 'Tingkat kelas minimal 10').max(12, 'Tingkat kelas maksimal 12'),
  departmentId: z.coerce.number({
    required_error: "Silahkan pilih jurusan",
    invalid_type_error: "Silahkan pilih jurusan",
  }).min(1, 'Silahkan pilih jurusan'),
  academicYear: z.string().min(4, 'Tahun ajaran harus diisi').regex(/^\d{4}-\d{4}$/, 'Format tahun ajaran: YYYY-YYYY'),
  isActive: z.boolean().default(true),
}).superRefine((data, ctx) => {
  // Tambahan validasi untuk memastikan departmentId ada
  if (!data.departmentId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Silahkan pilih jurusan",
      path: ["departmentId"]
    });
  }
});

type FormValues = z.infer<typeof formSchema>;

interface ClassFormProps {
  onSuccess: () => void;
  onError: (message: string) => void;
  defaultValues?: Partial<FormValues>;
  classId?: number;
}

const ClassForm: React.FC<ClassFormProps> = ({ 
  onSuccess, 
  onError, 
  defaultValues = {
    name: '',
    gradeLevel: 10,
    departmentId: undefined, // defaultValues biarkan undefined untuk handle validasi
    academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    isActive: true,
  },
  classId 
}) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const { data: departments, isLoading: isLoadingDepartments } = useQuery<Department[]>({
    queryKey: ['/api/departments'],
  });

  const gradeLevelOptions = [
    { value: 10, label: 'X (Kelas 10)' },
    { value: 11, label: 'XI (Kelas 11)' },
    { value: 12, label: 'XII (Kelas 12)' },
  ];

  const isEditMode = !!classId;

  const onSubmit = async (data: FormValues) => {
    try {
      console.log('Form submission data:', data);
      console.log('Department ID value:', data.departmentId, 
                 'Type:', typeof data.departmentId,
                 'Is valid:', !(!data.departmentId || isNaN(data.departmentId) || data.departmentId < 1));
      
      // Validasi manual untuk departmentId
      if (!data.departmentId || isNaN(data.departmentId) || data.departmentId < 1) {
        form.setError('departmentId', { 
          type: 'manual', 
          message: 'Silakan pilih jurusan' 
        });
        return onError('Silakan pilih jurusan');
      }
      
      if (isEditMode) {
        await apiRequest('PUT', `/api/classes/${classId}`, data);
      } else {
        await apiRequest('POST', '/api/classes', data);
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/classes'] });
      form.reset();
      onSuccess();
    } catch (error) {
      console.error('Form submission error:', error);
      onError(error instanceof Error ? error.message : 'Terjadi kesalahan');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {Object.keys(form.formState.errors).length > 0 && (
          <div className="p-3 rounded-md bg-destructive/15 text-destructive text-sm mb-4">
            <p className="font-semibold">Form memiliki kesalahan berikut:</p>
            <ul className="list-disc pl-5 mt-1">
              {Object.entries(form.formState.errors).map(([field, error]) => (
                <li key={field}>{error?.message}</li>
              ))}
            </ul>
          </div>
        )}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Kelas</FormLabel>
              <FormControl>
                <Input placeholder="Masukkan nama kelas" {...field} />
              </FormControl>
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
                value={field.value?.toString()}
                onValueChange={(value) => field.onChange(parseInt(value))}
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
          name="departmentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jurusan</FormLabel>
              <Select
                value={field.value?.toString()}
                onValueChange={(value) => field.onChange(parseInt(value))}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jurusan" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {isLoadingDepartments ? (
                    <SelectItem value="loading" disabled>Memuat data...</SelectItem>
                  ) : departments?.length ? (
                    departments.map((department) => (
                      <SelectItem key={department.id} value={department.id.toString()}>
                        {department.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="empty" disabled>Tidak ada data jurusan</SelectItem>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="academicYear"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tahun Ajaran</FormLabel>
              <FormControl>
                <Input placeholder="contoh: 2024-2025" {...field} />
              </FormControl>
              <FormDescription>
                Format tahun ajaran: YYYY-YYYY (contoh: 2024-2025)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Status Aktif</FormLabel>
                <FormMessage />
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
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

export default ClassForm;