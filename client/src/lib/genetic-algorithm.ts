export interface Chromosome {
  lessons: Lesson[];
  fitness: number;
}

export interface Lesson {
  classId: number;
  subjectId: number;
  teacherId: number;
  roomId: number;
  timeSlotId: number;
}

export interface GeneticParams {
  populationSize: number;
  generationCount: number;
  elitismCount: number;
  crossoverRate: number;
  mutationRate: number;
  tournamentSize: number;
  hardConstraints: {
    teacherConflict: boolean;
    classConflict: boolean;
    roomTypeMatch: boolean;
  };
  softConstraints: {
    teacherPreference: boolean;
    workloadDistribution: boolean;
  };
}

export interface ProgressInfo {
  currentGeneration: number;
  totalGenerations: number;
  bestFitness: number;
  fitnessHistory: number[];
}

export interface Resources {
  classes: any[];
  subjects: any[];
  teachers: any[];
  rooms: any[];
  timeSlots: any[];
  curriculum: any[];
  teacherSubjects: any[];
  teacherAvailability: any[];
  roomDepartments: any[];
}

// Used for client-side visualization only
// The actual genetic algorithm runs on the server
export class GeneticAlgorithm {
  private params: GeneticParams;
  private progress: ProgressInfo;
  private simulatedFitnessHistory: number[] = [];
  private isRunning = false;
  private interval: NodeJS.Timeout | null = null;
  private progressCallback: (progress: ProgressInfo) => void;

  constructor(
    params: GeneticParams,
    progressCallback: (progress: ProgressInfo) => void
  ) {
    this.params = params;
    this.progressCallback = progressCallback;
    this.progress = {
      currentGeneration: 0,
      totalGenerations: params.generationCount,
      bestFitness: 0,
      fitnessHistory: []
    };
  }

  // Start the simulation
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.progress.currentGeneration = 0;
    this.progress.fitnessHistory = [];
    
    // Simulate initial fitness
    let fitness = 300 + Math.random() * 200; // Start with a random fitness between 300-500
    this.progress.bestFitness = fitness;
    this.progress.fitnessHistory.push(fitness);
    
    // Simulate evolution with improvement over time
    this.interval = setInterval(() => {
      if (this.progress.currentGeneration >= this.params.generationCount) {
        this.stop();
        return;
      }
      
      // Increment generation
      this.progress.currentGeneration++;
      
      // Simulate fitness improvement
      // More improvement early, slowing down later
      const progressRatio = this.progress.currentGeneration / this.params.generationCount;
      const improvement = Math.random() * 10 * (1 - progressRatio * 0.8);
      
      // Add some randomness to make it look more realistic
      if (Math.random() > 0.8) {
        fitness += improvement;
      } else if (Math.random() > 0.95) {
        // Occasionally decrease slightly
        fitness -= improvement * 0.5;
      } else {
        // Most of the time increase slightly
        fitness += improvement * 0.3;
      }
      
      this.progress.bestFitness = fitness;
      this.progress.fitnessHistory.push(fitness);
      
      // Notify callback
      this.progressCallback({...this.progress});
    }, 500); // Update every 500ms
  }

  // Stop the simulation
  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
  }

  // Get current progress
  getProgress(): ProgressInfo {
    return {...this.progress};
  }

  // Set parameters
  setParams(params: GeneticParams): void {
    this.params = params;
    this.progress.totalGenerations = params.generationCount;
  }

  // Check if simulation is running
  isRunningSimulation(): boolean {
    return this.isRunning;
  }
}
