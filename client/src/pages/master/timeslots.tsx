import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  Plus, 
  Pencil, 
  Trash2, 
  MoreHorizontal, 
  Calendar
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { TimeSlot } from '@shared/schema';
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
import { Badge } from '@/components/ui/badge';
import TimeSlotForm from '@/components/forms/timeslot-form';
import { Skeleton } from '@/components/ui/skeleton';

const TimeSlotsPage: React.FC = () => {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [filterDay, setFilterDay] = useState<string>('all');
  
  // Fetch timeslots
  const { data: timeSlots, isLoading } = useQuery<TimeSlot[]>({
    queryKey: ['/api/timeslots'],
  });
  
  // Delete timeslot mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/timeslots/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Gagal menghapus slot waktu');
      }
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/timeslots'] });
      setIsDeleteDialogOpen(false);
      toast({
        title: 'Slot waktu dihapus',
        description: 'Data slot waktu telah berhasil dihapus',
        variant: 'success',
      });
    },
    onError: (error) => {
      toast({
        title: 'Gagal menghapus slot waktu',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
        variant: 'destructive',
      });
    },
  });

  const handleDelete = (timeSlot: TimeSlot) => {
    setSelectedTimeSlot(timeSlot);
    setIsDeleteDialogOpen(true);
  };

  const handleEdit = (timeSlot: TimeSlot) => {
    setSelectedTimeSlot(timeSlot);
    setIsEditDialogOpen(true);
  };

  const handleAddSuccess = () => {
    setIsAddDialogOpen(false);
    toast({
      title: 'Slot Waktu Ditambahkan',
      description: 'Data slot waktu telah berhasil ditambahkan',
      variant: 'success',
    });
  };

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
    toast({
      title: 'Slot Waktu Diperbarui',
      description: 'Data slot waktu telah berhasil diperbarui',
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
    if (selectedTimeSlot) {
      deleteMutation.mutate(selectedTimeSlot.id);
    }
  };

  const resetFilters = () => {
    setFilterDay('all');
  };

  // Helper to convert dayOfWeek number to name
  const getDayName = (dayOfWeek: number) => {
    switch (dayOfWeek) {
      case 1: return 'Senin';
      case 2: return 'Selasa';
      case 3: return 'Rabu';
      case 4: return 'Kamis';
      case 5: return 'Jumat';
      default: return 'Tidak diketahui';
    }
  };

  // Sort timeslots by day and slot number
  const sortedTimeSlots = timeSlots?.sort((a, b) => {
    if (a.dayOfWeek !== b.dayOfWeek) {
      return a.dayOfWeek - b.dayOfWeek;
    }
    return a.slotNumber - b.slotNumber;
  });

  // Group timeslots by day
  const timeSlotsByDay = React.useMemo(() => {
    if (!sortedTimeSlots || sortedTimeSlots.length === 0) return {};
    return sortedTimeSlots.reduce<Record<number, TimeSlot[]>>((acc, timeSlot) => {
      if (!acc[timeSlot.dayOfWeek]) {
        acc[timeSlot.dayOfWeek] = [];
      }
      acc[timeSlot.dayOfWeek].push(timeSlot);
      return acc;
    }, {});
  }, [sortedTimeSlots]);

  // Format time for display
  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    // Convert "HH:MM:SS" format to "HH:MM" if needed
    if (timeStr.includes(':')) {
      const parts = timeStr.split(':');
      return `${parts[0]}:${parts[1]}`;
    }
    return timeStr;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manajemen Slot Waktu</h1>
          <p className="text-muted-foreground">Kelola jam pelajaran dan periode waktu</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Slot Waktu
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Tambah Slot Waktu Baru</DialogTitle>
            </DialogHeader>
            <TimeSlotForm
              onSuccess={handleAddSuccess}
              onError={handleFormError}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Hari</label>
              <Select value={filterDay} onValueChange={setFilterDay}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Hari" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Hari</SelectItem>
                  <SelectItem value="1">Senin</SelectItem>
                  <SelectItem value="2">Selasa</SelectItem>
                  <SelectItem value="3">Rabu</SelectItem>
                  <SelectItem value="4">Kamis</SelectItem>
                  <SelectItem value="5">Jumat</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="md:col-span-2 flex items-end">
              <Button variant="outline" onClick={resetFilters} size="sm" className="ml-auto">
                Reset Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tampilan per hari */}
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
      ) : filterDay === 'all' && timeSlotsByDay ? (
        // View grouped by day
        Object.entries(timeSlotsByDay).map(([dayKey, slots]) => {
          const dayOfWeek = parseInt(dayKey);
          return (
            <Card key={dayKey}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  {getDayName(dayOfWeek)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {slots.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Slot</TableHead>
                        <TableHead>Jam Mulai</TableHead>
                        <TableHead>Jam Selesai</TableHead>
                        <TableHead>Durasi</TableHead>
                        <TableHead className="w-[100px]">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {slots.map((timeSlot) => {
                        // Calculate duration
                        const startParts = formatTime(timeSlot.startTime).split(':');
                        const endParts = formatTime(timeSlot.endTime).split(':');
                        const startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
                        const endMinutes = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
                        const durationMinutes = endMinutes - startMinutes;
                        const hours = Math.floor(durationMinutes / 60);
                        const minutes = durationMinutes % 60;
                        const durationText = `${hours > 0 ? `${hours} jam ` : ''}${minutes > 0 ? `${minutes} menit` : ''}`;

                        return (
                          <TableRow key={timeSlot.id}>
                            <TableCell>
                              <Badge variant="outline" className="font-medium">
                                Jam ke-{timeSlot.slotNumber}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatTime(timeSlot.startTime)}</TableCell>
                            <TableCell>{formatTime(timeSlot.endTime)}</TableCell>
                            <TableCell>{durationText}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Aksi</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEdit(timeSlot)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => handleDelete(timeSlot)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Hapus
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center">
                    <p className="text-muted-foreground">Belum ada slot waktu pada hari ini</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-4"
                      onClick={() => {
                        setIsAddDialogOpen(true);
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Tambah Slot
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })
      ) : (
        // View for filtered day or no data
        <Card>
          <CardHeader>
            <CardTitle>Daftar Slot Waktu</CardTitle>
          </CardHeader>
          <CardContent>
            {sortedTimeSlots && sortedTimeSlots.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hari</TableHead>
                    <TableHead>Slot</TableHead>
                    <TableHead>Jam Mulai</TableHead>
                    <TableHead>Jam Selesai</TableHead>
                    <TableHead>Durasi</TableHead>
                    <TableHead className="w-[100px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedTimeSlots.map((timeSlot) => {
                    // Calculate duration
                    const startParts = formatTime(timeSlot.startTime).split(':');
                    const endParts = formatTime(timeSlot.endTime).split(':');
                    const startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
                    const endMinutes = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
                    const durationMinutes = endMinutes - startMinutes;
                    const hours = Math.floor(durationMinutes / 60);
                    const minutes = durationMinutes % 60;
                    const durationText = `${hours > 0 ? `${hours} jam ` : ''}${minutes > 0 ? `${minutes} menit` : ''}`;

                    return (
                      <TableRow key={timeSlot.id}>
                        <TableCell>{getDayName(timeSlot.dayOfWeek)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-medium">
                            Jam ke-{timeSlot.slotNumber}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatTime(timeSlot.startTime)}</TableCell>
                        <TableCell>{formatTime(timeSlot.endTime)}</TableCell>
                        <TableCell>{durationText}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Aksi</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(timeSlot)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onClick={() => handleDelete(timeSlot)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Hapus
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Clock className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Belum ada data slot waktu</h3>
                <p className="text-muted-foreground mb-6">
                  Anda belum memiliki data slot waktu. Silahkan tambahkan data slot waktu baru.
                </p>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Slot Waktu
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Slot Waktu</DialogTitle>
          </DialogHeader>
          {selectedTimeSlot && (
            <TimeSlotForm
              onSuccess={handleEditSuccess}
              onError={handleFormError}
              defaultValues={{
                ...selectedTimeSlot,
                startTime: formatTime(selectedTimeSlot.startTime),
                endTime: formatTime(selectedTimeSlot.endTime),
              }}
              timeSlotId={selectedTimeSlot.id}
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
              Apakah Anda yakin ingin menghapus slot waktu pada hari {selectedTimeSlot && getDayName(selectedTimeSlot.dayOfWeek)} jam ke-{selectedTimeSlot?.slotNumber}? 
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

export default TimeSlotsPage;