import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, RefreshCw, Loader2 } from 'lucide-react';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface TemplatePageProps {
  title: string;
  description: string;
  endpoint: string;
  createFormComponent: React.ComponentType<any>;
  tableComponent: React.ComponentType<any>;
  queryKey: string;
}

const TemplateManagementPage: React.FC<TemplatePageProps> = ({
  title,
  description,
  endpoint,
  createFormComponent: CreateForm,
  tableComponent: DataTable,
  queryKey,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const { 
    data, 
    isLoading, 
    isError, 
    refetch 
  } = useQuery({
    queryKey: [queryKey]
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `${endpoint}/${id}`);
    },
    onSuccess: () => {
      toast({
        title: 'Berhasil',
        description: 'Data berhasil dihapus',
        variant: 'success' as any,
      });
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Gagal menghapus data',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleDelete = (id: number) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data ini?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Tambah Baru
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Tambah {title}</DialogTitle>
              </DialogHeader>
              <CreateForm 
                onSuccess={() => {
                  setIsDialogOpen(false);
                  queryClient.invalidateQueries({ queryKey: [queryKey] });
                  toast({
                    title: 'Berhasil',
                    description: 'Data berhasil ditambahkan',
                    variant: 'success' as any,
                  });
                }}
                onError={(message: string) => {
                  toast({
                    title: 'Gagal menambahkan data',
                    description: message,
                    variant: 'destructive',
                  });
                }}
              />
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data {title}</CardTitle>
          <CardDescription>
            Daftar data {title.toLowerCase()} di sistem
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : isError ? (
            <div className="text-center py-6 text-red-500">
              Terjadi kesalahan saat memuat data. Silakan coba lagi.
            </div>
          ) : (
            <DataTable 
              data={data || []} 
              onDelete={handleDelete}
              onEdit={(id: number) => {
                // Handle edit functionality
                console.log('Edit item with ID:', id);
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TemplateManagementPage;