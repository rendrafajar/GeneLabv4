import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { insertDepartmentSchema } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';

// Extend the insertDepartmentSchema with validation rules
const formSchema = insertDepartmentSchema.extend({
  name: z.string().min(2, 'Nama jurusan minimal 2 karakter'),
  code: z.string().min(2, 'Kode jurusan minimal 2 karakter').max(10, 'Kode jurusan maksimal 10 karakter'),
  description: z.string().optional().transform(v => v === null ? '' : v),
});

type FormValues = z.infer<typeof formSchema>;

interface DepartmentFormProps {
  onSuccess: () => void;
  onError: (message: string) => void;
  defaultValues?: Partial<FormValues>;
  departmentId?: number;
}

const DepartmentForm: React.FC<DepartmentFormProps> = ({ 
  onSuccess, 
  onError, 
  defaultValues = {
    name: '',
    code: '',
    description: '',
  },
  departmentId 
}) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...defaultValues,
      description: defaultValues.description || '',
    },
  });

  const isEditMode = !!departmentId;

  const onSubmit = async (data: FormValues) => {
    try {
      if (isEditMode) {
        await apiRequest('PUT', `/api/departments/${departmentId}`, data);
      } else {
        await apiRequest('POST', '/api/departments', data);
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/departments'] });
      form.reset();
      onSuccess();
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Terjadi kesalahan');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Jurusan</FormLabel>
              <FormControl>
                <Input placeholder="Masukkan nama jurusan" {...field} />
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
              <FormLabel>Kode Jurusan</FormLabel>
              <FormControl>
                <Input placeholder="Masukkan kode jurusan" {...field} />
              </FormControl>
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
                <Textarea placeholder="Deskripsi jurusan (opsional)" {...field} />
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

export default DepartmentForm;