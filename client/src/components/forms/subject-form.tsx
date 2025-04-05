import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { insertSubjectSchema, Department } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';

// Extend the insertSubjectSchema with validation rules
const formSchema = insertSubjectSchema.extend({
  name: z.string().min(3, "Nama mata pelajaran minimal 3 karakter"),
  code: z.string().min(2, "Kode mata pelajaran minimal 2 karakter"),
  description: z.string().optional(),
  gradeLevel: z.coerce.number({
    required_error: "Tingkat kelas harus dipilih",
    invalid_type_error: "Tingkat kelas harus dipilih",
  }).min(10, "Tingkat kelas minimal 10").max(12, "Tingkat kelas maksimal 12"),
  departmentId: z.coerce.number().optional(),
  isCompulsory: z.boolean().default(true),
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
    description: '',
    gradeLevel: 10,
    departmentId: undefined,
    isCompulsory: true,
  },
  subjectId 
}) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const [isGeneric, setIsGeneric] = useState<boolean>(defaultValues.departmentId === undefined);

  // Fetch departments
  const { data: departments } = useQuery<Department[]>({
    queryKey: ['/api/departments'],
  });

  const isEditMode = !!subjectId;

  // Handle department selection change
  useEffect(() => {
    if (isGeneric) {
      form.setValue('departmentId', undefined);
    }
  }, [isGeneric, form]);

  const onSubmit = async (data: FormValues) => {
    try {
      // If isGeneric is true, make sure departmentId is undefined
      if (isGeneric) {
        data.departmentId = undefined;
      }
      
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
                <Input placeholder="Contoh: Matematika" {...field} />
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
                <Input placeholder="Contoh: MTK" {...field} />
              </FormControl>
              <FormDescription>
                Kode unik untuk mata pelajaran ini
              </FormDescription>
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
                <Textarea 
                  placeholder="Deskripsi mata pelajaran" 
                  className="resize-none min-h-[100px]"
                  {...field} 
                />
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
                value={field.value?.toString() || ''}
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
        
        <div className="flex items-center space-x-2 mb-4">
          <Checkbox 
            id="isGeneric" 
            checked={isGeneric} 
            onCheckedChange={(checked) => setIsGeneric(checked as boolean)}
          />
          <label
            htmlFor="isGeneric"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Mata pelajaran umum (tidak terikat jurusan)
          </label>
        </div>
        
        {!isGeneric && (
          <FormField
            control={form.control}
            name="departmentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Jurusan</FormLabel>
                <Select
                  value={field.value?.toString() || ''}
                  onValueChange={(value) => field.onChange(parseInt(value))}
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
        )}
        
        <FormField
          control={form.control}
          name="isCompulsory"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Mata Pelajaran Wajib</FormLabel>
                <FormDescription>
                  Mata pelajaran ini wajib diambil oleh semua siswa
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        
        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? 'Menyimpan...' : isEditMode ? 'Perbarui' : 'Simpan'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default SubjectForm;