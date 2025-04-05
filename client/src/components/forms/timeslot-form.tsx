import React from 'react';
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
import { insertTimeSlotSchema } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';

// Extend the insertTimeSlotSchema with validation rules
const formSchema = insertTimeSlotSchema.extend({
  dayOfWeek: z.coerce.number({
    required_error: "Hari harus dipilih",
    invalid_type_error: "Hari harus dipilih",
  }).min(1, "Hari tidak valid").max(5, "Hari tidak valid"),
  slotNumber: z.coerce.number({
    required_error: "Nomor slot harus diisi",
    invalid_type_error: "Nomor slot harus berupa angka",
  }).min(1, "Minimal slot ke-1").max(10, "Maksimal slot ke-10"),
  startTime: z.string().min(5, "Format waktu mulai tidak valid"),
  endTime: z.string().min(5, "Format waktu selesai tidak valid"),
}).refine(data => {
  if (!data.startTime || !data.endTime) return true;
  
  // Parse time
  const [startHour, startMinute] = data.startTime.split(':').map(Number);
  const [endHour, endMinute] = data.endTime.split(':').map(Number);
  
  const startDate = new Date();
  startDate.setHours(startHour, startMinute, 0);
  
  const endDate = new Date();
  endDate.setHours(endHour, endMinute, 0);
  
  return endDate > startDate;
}, {
  message: "Waktu selesai harus lebih besar dari waktu mulai",
  path: ["endTime"]
});

type FormValues = z.infer<typeof formSchema>;

interface TimeSlotFormProps {
  onSuccess: () => void;
  onError: (message: string) => void;
  defaultValues?: Partial<FormValues>;
  timeSlotId?: number;
}

const TimeSlotForm: React.FC<TimeSlotFormProps> = ({ 
  onSuccess, 
  onError, 
  defaultValues = {
    dayOfWeek: 1,
    slotNumber: 1, 
    startTime: '07:00',
    endTime: '07:45',
  },
  timeSlotId 
}) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const isEditMode = !!timeSlotId;

  const onSubmit = async (data: FormValues) => {
    try {
      if (isEditMode) {
        await apiRequest('PUT', `/api/timeslots/${timeSlotId}`, data);
      } else {
        await apiRequest('POST', '/api/timeslots', data);
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/timeslots'] });
      form.reset();
      onSuccess();
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Terjadi kesalahan');
    }
  };

  const dayOptions = [
    { value: 1, label: 'Senin' },
    { value: 2, label: 'Selasa' },
    { value: 3, label: 'Rabu' },
    { value: 4, label: 'Kamis' },
    { value: 5, label: 'Jumat' },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="dayOfWeek"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hari</FormLabel>
              <Select
                value={field.value?.toString() || ''}
                onValueChange={(value) => field.onChange(parseInt(value))}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih hari" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {dayOptions.map((option) => (
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
          name="slotNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jam Ke-</FormLabel>
              <FormControl>
                <Input 
                  type="number"
                  min="1"
                  max="10"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || '')}
                />
              </FormControl>
              <FormDescription>
                Urutan slot waktu (misalnya: 1 untuk jam pertama, 2 untuk jam kedua, dst)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Waktu Mulai</FormLabel>
                <FormControl>
                  <Input 
                    type="time"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Waktu Selesai</FormLabel>
                <FormControl>
                  <Input 
                    type="time"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
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

export default TimeSlotForm;