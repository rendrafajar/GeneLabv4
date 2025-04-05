import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { GeneticAlgorithm, GeneticParams } from '@/lib/genetic-algorithm';
import { apiRequest, queryClient } from '@/lib/queryClient';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Ban, Loader2, PlayCircle } from 'lucide-react';

// Form schema
const formSchema = z.object({
  scheduleName: z.string().min(3, 'Nama jadwal minimal 3 karakter'),
  academicYear: z.string().min(5, 'Tahun ajaran harus diisi'),
  populationSize: z.coerce.number().int().min(10).max(1000),
  generationCount: z.coerce.number().int().min(10).max(1000),
  elitismCount: z.coerce.number().int().min(1).max(50),
  crossoverRate: z.coerce.number().min(0).max(1),
  mutationRate: z.coerce.number().min(0).max(1),
  tournamentSize: z.coerce.number().int().min(2).max(50),
  constraints: z.object({
    teacherConflict: z.boolean().default(true),
    classConflict: z.boolean().default(true),
    roomTypeMatch: z.boolean().default(true),
    teacherPreference: z.boolean().default(true),
    workloadDistribution: z.boolean().default(true),
  }),
});

type FormValues = z.infer<typeof formSchema>;

const GenerateSchedule = () => {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<{
    currentGeneration: number;
    totalGenerations: number;
    bestFitness: number;
    fitnessHistory: number[];
  }>({
    currentGeneration: 0,
    totalGenerations: 100,
    bestFitness: 0,
    fitnessHistory: []
  });
  const [gaInstance, setGaInstance] = useState<GeneticAlgorithm | null>(null);

  // Query academic years (could be fetched from API in real app)
  const academicYears = [
    "2023/2024",
    "2024/2025",
    "2025/2026",
  ];

  // Initialize form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      scheduleName: '',
      academicYear: academicYears[0],
      populationSize: 100,
      generationCount: 100,
      elitismCount: 5,
      crossoverRate: 0.8,
      mutationRate: 0.2,
      tournamentSize: 5,
      constraints: {
        teacherConflict: true,
        classConflict: true,
        roomTypeMatch: true,
        teacherPreference: true,
        workloadDistribution: true,
      },
    },
  });

  // Create schedule mutation
  const createScheduleMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/schedules", data);
      return await res.json();
    },
    onSuccess: (schedule) => {
      toast({
        title: "Jadwal berhasil dibuat",
        description: "Jadwal telah dibuat dan siap untuk di-generate",
      });
      startGeneration(schedule.id);
    },
    onError: (error) => {
      toast({
        title: "Gagal membuat jadwal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Generate schedule mutation
  const generateScheduleMutation = useMutation({
    mutationFn: async ({ scheduleId, params }: { scheduleId: number; params: GeneticParams }) => {
      const res = await apiRequest("POST", `/api/schedules/${scheduleId}/generate`, params);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Proses generasi dimulai",
        description: "Sistem sedang memproses jadwal, mohon tunggu",
      });
      
      // Start simulation for visualization
      simulateGeneration(form.getValues().generationCount);
    },
    onError: (error) => {
      setIsGenerating(false);
      toast({
        title: "Gagal memulai generasi jadwal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Function to create schedule and start generation
  const onSubmit = (values: FormValues) => {
    const { scheduleName, academicYear, ...geneticParams } = values;
    
    // Create schedule first
    createScheduleMutation.mutate({
      name: scheduleName,
      academicYear,
      status: 'draft',
      createdBy: user?.id
    });
  };

  // Start generation process
  const startGeneration = (scheduleId: number) => {
    const { populationSize, generationCount, elitismCount, crossoverRate, mutationRate, tournamentSize, constraints } = form.getValues();
    
    const params: GeneticParams = {
      populationSize,
      generationCount,
      elitismCount,
      crossoverRate,
      mutationRate,
      tournamentSize,
      hardConstraints: {
        teacherConflict: constraints.teacherConflict,
        classConflict: constraints.classConflict,
        roomTypeMatch: constraints.roomTypeMatch,
      },
      softConstraints: {
        teacherPreference: constraints.teacherPreference,
        workloadDistribution: constraints.workloadDistribution,
      }
    };
    
    setIsGenerating(true);
    generateScheduleMutation.mutate({ scheduleId, params });
  };

  // Simulate generation for frontend visualization
  const simulateGeneration = (totalGenerations: number) => {
    const ga = new GeneticAlgorithm(
      {
        populationSize: form.getValues().populationSize,
        generationCount: totalGenerations,
        elitismCount: form.getValues().elitismCount,
        crossoverRate: form.getValues().crossoverRate,
        mutationRate: form.getValues().mutationRate,
        tournamentSize: form.getValues().tournamentSize,
        hardConstraints: {
          teacherConflict: form.getValues().constraints.teacherConflict,
          classConflict: form.getValues().constraints.classConflict,
          roomTypeMatch: form.getValues().constraints.roomTypeMatch,
        },
        softConstraints: {
          teacherPreference: form.getValues().constraints.teacherPreference,
          workloadDistribution: form.getValues().constraints.workloadDistribution,
        }
      },
      (progress) => {
        setGenerationProgress(progress);
        
        // When complete, navigate to view the schedule
        if (progress.currentGeneration >= progress.totalGenerations) {
          setTimeout(() => {
            setIsGenerating(false);
            toast({
              title: "Generasi jadwal selesai",
              description: "Jadwal berhasil digenerate dan siap digunakan",
            });
            navigate("/");
          }, 1000);
        }
      }
    );
    
    setGaInstance(ga);
    ga.start();
  };

  // Cancel generation
  const cancelGeneration = () => {
    if (gaInstance) {
      gaInstance.stop();
    }
    setIsGenerating(false);
    toast({
      title: "Generasi jadwal dibatalkan",
      description: "Proses generasi jadwal telah dibatalkan",
    });
  };

  // Calculate progress percentage
  const progressPercentage = isGenerating 
    ? Math.round((generationProgress.currentGeneration / generationProgress.totalGenerations) * 100)
    : 0;

  // Get generation status text
  const getGenerationStatus = () => {
    const { currentGeneration, totalGenerations } = generationProgress;
    const progress = currentGeneration / totalGenerations;
    
    if (progress < 0.2) {
      return "Inisialisasi populasi awal...";
    } else if (progress < 0.4) {
      return "Evaluasi fitness populasi...";
    } else if (progress < 0.6) {
      return "Applying crossover operator...";
    } else if (progress < 0.8) {
      return "Applying mutation operator...";
    } else if (progress < 1) {
      return "Finalizing schedule...";
    } else {
      return "Jadwal berhasil dibuat!";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Generate Jadwal Baru</CardTitle>
        </CardHeader>
        <CardContent>
          {!isGenerating ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="scheduleName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Jadwal</FormLabel>
                        <FormControl>
                          <Input placeholder="Jadwal Semester Ganjil 2023/2024" {...field} />
                        </FormControl>
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
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih tahun ajaran" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {academicYears.map(year => (
                              <SelectItem key={year} value={year}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <div>
                  <h3 className="text-base font-medium text-gray-900">Parameter Algoritma Genetika</h3>
                  <p className="mt-1 text-sm text-gray-500">Konfigurasi parameter untuk mengoptimalkan hasil penjadwalan</p>
                </div>

                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="populationSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ukuran Populasi</FormLabel>
                        <FormControl>
                          <Input type="number" min={10} max={1000} {...field} />
                        </FormControl>
                        <FormDescription>Jumlah individu dalam populasi</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="generationCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jumlah Generasi</FormLabel>
                        <FormControl>
                          <Input type="number" min={10} max={1000} {...field} />
                        </FormControl>
                        <FormDescription>Berapa banyak iterasi yang dilakukan</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="elitismCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jumlah Elitism</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} max={50} {...field} />
                        </FormControl>
                        <FormDescription>Berapa individu terbaik yang dipertahankan</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="crossoverRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Probabilitas Crossover</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} max={1} step={0.01} {...field} />
                        </FormControl>
                        <FormDescription>Kemungkinan terjadinya crossover (0-1)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mutationRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Probabilitas Mutasi</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} max={1} step={0.01} {...field} />
                        </FormControl>
                        <FormDescription>Kemungkinan terjadinya mutasi (0-1)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tournamentSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ukuran Turnamen</FormLabel>
                        <FormControl>
                          <Input type="number" min={2} max={50} {...field} />
                        </FormControl>
                        <FormDescription>Ukuran kelompok seleksi turnamen</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <div>
                  <h3 className="text-base font-medium text-gray-900">Batasan Penjadwalan</h3>
                  <p className="mt-1 text-sm text-gray-500">Batasan yang harus dipenuhi oleh jadwal yang dihasilkan</p>
                </div>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="constraints.teacherConflict"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Tidak boleh ada guru mengajar di dua tempat bersamaan (Hard Constraint)
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="constraints.classConflict"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Tidak boleh ada kelas menerima dua pelajaran bersamaan (Hard Constraint)
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="constraints.roomTypeMatch"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Ruang kelas harus sesuai dengan jurusan dan jenis mata pelajaran (Hard Constraint)
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="constraints.teacherPreference"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Mempertimbangkan preferensi guru untuk hari/jam tertentu (Soft Constraint)
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="constraints.workloadDistribution"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Distribusi beban mengajar guru merata (Soft Constraint)
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <Button type="button" variant="outline" asChild>
                    <a href="/">Batalkan</a>
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createScheduleMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    {createScheduleMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Memproses...</span>
                      </>
                    ) : (
                      <>
                        <PlayCircle className="h-4 w-4" />
                        <span>Mulai Generate</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Proses Generasi Jadwal</h3>
              
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">
                    Progress: <span id="progressPercentage">{progressPercentage}%</span>
                  </span>
                  <span className="text-sm font-medium text-gray-700">
                    Generasi: <span id="currentGeneration">{generationProgress.currentGeneration}</span>/<span id="totalGenerations">{generationProgress.totalGenerations}</span>
                  </span>
                </div>
                <Progress value={progressPercentage} className="h-2.5" />
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Status:</h3>
                <div id="generationStatus" className="p-3 bg-gray-50 rounded-md text-sm text-gray-700">
                  {getGenerationStatus()}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Fitness Score Terbaik:</h3>
                <div className="p-3 bg-gray-50 rounded-md">
                  <div className="h-48 w-full flex items-center justify-center">
                    <div className="w-full h-full flex flex-col">
                      <div className="font-bold text-lg text-center text-gray-700 mb-2">
                        {Math.round(generationProgress.bestFitness)}
                      </div>
                      <div className="flex-1 flex items-end w-full">
                        {generationProgress.fitnessHistory.map((fitness, index) => (
                          <div 
                            key={index} 
                            className="bg-primary w-1 mx-[1px]" 
                            style={{ 
                              height: `${(fitness / 1000) * 100}%`,
                              maxHeight: '100%'
                            }}
                          ></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={cancelGeneration}
                  className="flex items-center gap-2"
                >
                  <Ban className="h-4 w-4" />
                  <span>Batalkan</span>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GenerateSchedule;
