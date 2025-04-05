import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { insertTeacherSchema } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';

// Extend the insertTeacherSchema with validation rules
const formSchema = insertTeacherSchema.extend({
  name: z.string().min(2, 'Nama guru minimal 2 karakter'),
  code: z.string().min(2, 'Kode guru minimal 2 karakter').max(10, 'Kode guru maksimal 10 karakter'),
  specialization: z.string().optional().transform(v => v === null ? '' : v),
  email: z.string().email('Format email tidak valid').optional().transform(v => v === null ? '' : v),
  phone: z.string().optional().transform(v => v === null ? '' : v),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface TeacherFormProps {
  onSuccess: () => void;
  onError: (message: string) => void;
  defaultValues?: Partial<FormValues>;
  teacherId?: number;
}

const TeacherForm: React.FC<TeacherFormProps> = ({ 
  onSuccess, 
  onError, 
  defaultValues = {
    name: '',
    code: '',
    specialization: '',
    email: '',
    phone: '',
    isActive: true,
  },
  teacherId 
}) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...defaultValues,
      specialization: defaultValues.specialization || '',
      email: defaultValues.email || '',
      phone: defaultValues.phone || '',
    },
  });

  const isEditMode = !!teacherId;

  const onSubmit = async (data: FormValues) => {
    try {
      if (isEditMode) {
        await apiRequest('PUT', `/api/teachers/${teacherId}`, data);
      } else {
        await apiRequest('POST', '/api/teachers', data);
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/teachers'] });
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
              <FormLabel>Nama Guru</FormLabel>
              <FormControl>
                <Input placeholder="Masukkan nama guru" {...field} />
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
              <FormLabel>Kode Guru</FormLabel>
              <FormControl>
                <Input placeholder="Masukkan kode guru" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="specialization"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Spesialisasi/Bidang Keahlian</FormLabel>
              <FormControl>
                <Input placeholder="Spesialisasi guru (opsional)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Email guru (opsional)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nomor Telepon</FormLabel>
                <FormControl>
                  <Input placeholder="Nomor telepon (opsional)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
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

export default TeacherForm;