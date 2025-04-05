import React, { useState } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { insertRoomSchema, Department } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

// Extend the insertRoomSchema with validation rules
const formSchema = insertRoomSchema.extend({
  name: z.string().min(2, 'Nama ruangan minimal 2 karakter'),
  code: z.string().min(2, 'Kode ruangan minimal 2 karakter').max(10, 'Kode ruangan maksimal 10 karakter'),
  capacity: z.coerce.number().min(1, 'Kapasitas minimal 1 orang'),
  type: z.enum(['teori', 'praktikum']),
  description: z.string().optional().transform(v => v === null ? '' : v),
});

type FormValues = z.infer<typeof formSchema>;

interface RoomFormProps {
  onSuccess: () => void;
  onError: (message: string) => void;
  defaultValues?: Partial<FormValues>;
  roomId?: number;
}

const RoomForm: React.FC<RoomFormProps> = ({ 
  onSuccess, 
  onError, 
  defaultValues = {
    name: '',
    code: '',
    capacity: 30,
    type: 'teori',
    isActive: true,
    description: '',
  },
  roomId 
}) => {
  const [selectedDepartments, setSelectedDepartments] = useState<number[]>([]);
  
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

  // If editing a room, fetch its department assignments
  const { data: roomDepartments } = useQuery({
    queryKey: ['/api/rooms', roomId, 'departments'],
    enabled: !!roomId,
    queryFn: async () => {
      if (!roomId) return [];
      const response = await fetch(`/api/rooms/${roomId}/departments`);
      if (!response.ok) throw new Error('Failed to fetch room departments');
      return response.json();
    }
  });
  
  // Set selected departments when roomDepartments change
  React.useEffect(() => {
    if (roomDepartments && Array.isArray(roomDepartments)) {
      // Extract department IDs from the response
      const departmentIds = roomDepartments.map(item => item.departmentId);
      setSelectedDepartments(departmentIds);
    }
  }, [roomDepartments]);

  const isEditMode = !!roomId;

  const onSubmit = async (data: FormValues) => {
    try {
      if (isEditMode) {
        await apiRequest('PUT', `/api/rooms/${roomId}`, data);
        
        // Update department assignments for room
        await apiRequest('PUT', `/api/rooms/${roomId}/departments`, {
          departmentIds: selectedDepartments
        });
      } else {
        const response = await apiRequest('POST', '/api/rooms', data);
        const newRoom = await response.json();
        
        // Add department assignments for the new room
        if (selectedDepartments.length > 0 && newRoom && newRoom.id) {
          await apiRequest('PUT', `/api/rooms/${newRoom.id}/departments`, {
            departmentIds: selectedDepartments
          });
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/rooms'] });
      form.reset();
      onSuccess();
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Terjadi kesalahan');
    }
  };

  // Toggle department selection
  const toggleDepartment = (departmentId: number) => {
    setSelectedDepartments(prev => {
      if (prev.includes(departmentId)) {
        return prev.filter(id => id !== departmentId);
      } else {
        return [...prev, departmentId];
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama Ruangan</FormLabel>
                <FormControl>
                  <Input placeholder="Masukkan nama ruangan" {...field} />
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
                <FormLabel>Kode Ruangan</FormLabel>
                <FormControl>
                  <Input placeholder="Masukkan kode ruangan" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kapasitas</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Masukkan kapasitas ruangan" 
                      {...field} 
                      onChange={(e) => field.onChange(parseInt(e.target.value) || '')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="type"
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
                      <SelectItem value="teori">Kelas Teori</SelectItem>
                      <SelectItem value="praktikum">Lab/Workshop</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>Status Aktif</FormLabel>
                  <FormDescription>
                    Ruangan dapat digunakan dalam penjadwalan
                  </FormDescription>
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
          
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Deskripsi</FormLabel>
                <FormControl>
                  <Textarea placeholder="Deskripsi ruangan (opsional)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {departments && departments.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Tetapkan Jurusan</CardTitle>
              <CardDescription>
                Pilih jurusan yang dapat menggunakan ruangan ini
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {departments.map((department) => (
                  <div key={department.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`department-${department.id}`}
                      checked={selectedDepartments.includes(department.id)}
                      onCheckedChange={() => toggleDepartment(department.id)}
                    />
                    <label 
                      htmlFor={`department-${department.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {department.name}
                    </label>
                  </div>
                ))}
              </div>
              
              {selectedDepartments.length === 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  Jika tidak ada jurusan yang dipilih, ruangan ini akan tersedia untuk semua jurusan.
                </p>
              )}
            </CardContent>
          </Card>
        )}
        
        <div className="flex justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Menyimpan...' : isEditMode ? 'Perbarui' : 'Simpan'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default RoomForm;