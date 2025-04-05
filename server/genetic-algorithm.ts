import { 
  Teacher, 
  Subject, 
  Class, 
  Room, 
  TimeSlot, 
  TeacherAvailability, 
  TeacherSubject,
  RoomDepartment,
  Curriculum,
  ScheduleDetail,
  GeneticParams
} from "@shared/schema";

// A single class session (lesson) in the schedule
interface Lesson {
  classId: number;
  subjectId: number;
  teacherId: number;
  roomId: number;
  timeSlotId: number;
}

// Chromosome represents a complete schedule
class Chromosome {
  lessons: Lesson[];
  fitness: number;

  constructor(lessons: Lesson[] = []) {
    this.lessons = lessons;
    this.fitness = 0;
  }

  copy(): Chromosome {
    return new Chromosome([...this.lessons.map(lesson => ({ ...lesson }))]);
  }
}

// Mutation types
enum MutationType {
  CHANGE_ROOM,
  CHANGE_TIME,
  CHANGE_TEACHER,
  SWAP_TIMESLOTS
}

interface ResourcePool {
  classes: Class[];
  subjects: Subject[];
  teachers: Teacher[];
  rooms: Room[];
  timeSlots: TimeSlot[];
  curriculum: Curriculum[];
  teacherSubjects: TeacherSubject[];
  teacherAvailability: TeacherAvailability[];
  roomDepartments: RoomDepartment[];
}

export class GeneticAlgorithm {
  private params: GeneticParams;
  private resources: ResourcePool;
  private population: Chromosome[];
  private bestChromosome: Chromosome | null = null;
  private currentGeneration = 0;
  private fitnessHistory: number[] = [];

  constructor(params: GeneticParams, resources: ResourcePool) {
    this.params = params;
    this.resources = resources;
    this.population = [];
  }

  // Initialize population with random schedules
  initialize(): void {
    this.population = [];
    this.currentGeneration = 0;
    this.fitnessHistory = [];

    for (let i = 0; i < this.params.populationSize; i++) {
      this.population.push(this.createRandomChromosome());
    }

    // Calculate fitness for each chromosome
    this.evaluatePopulation();
  }

  // Create a random chromosome (random schedule)
  private createRandomChromosome(): Chromosome {
    const lessons: Lesson[] = [];
    
    // For each class and their curriculum subjects, create lessons
    for (const classItem of this.resources.classes) {
      // Get curriculum for this class
      const classCurriculum = this.resources.curriculum.filter(
        c => c.departmentId === classItem.departmentId && c.gradeLevel === classItem.gradeLevel
      );

      for (const curriculumItem of classCurriculum) {
        const subject = this.resources.subjects.find(s => s.id === curriculumItem.subjectId);
        if (!subject) continue;

        // Find eligible teachers for this subject
        const eligibleTeachers = this.resources.teacherSubjects
          .filter(ts => ts.subjectId === subject.id)
          .map(ts => ts.teacherId);
        
        if (eligibleTeachers.length === 0) continue;

        // Find eligible rooms for this subject
        let eligibleRooms: number[] = [];
        if (subject.roomType === 'teori') {
          eligibleRooms = this.resources.rooms
            .filter(r => r.type === 'teori')
            .map(r => r.id);
        } else {
          // For praktikum, need specific rooms
          eligibleRooms = this.resources.rooms
            .filter(r => r.type === 'praktikum')
            .map(r => r.id);
        }

        if (eligibleRooms.length === 0) continue;

        // Create lessons for each hour per week required
        for (let hour = 0; hour < curriculumItem.hoursPerWeek; hour++) {
          // Randomly select teacher, room, and time slot
          const teacherId = this.getRandomElement(eligibleTeachers);
          const roomId = this.getRandomElement(eligibleRooms);
          const timeSlotId = this.getRandomElement(this.resources.timeSlots.map(ts => ts.id));

          lessons.push({
            classId: classItem.id,
            subjectId: subject.id,
            teacherId,
            roomId,
            timeSlotId
          });
        }
      }
    }

    return new Chromosome(lessons);
  }

  // Helper to get random element from array
  private getRandomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  // Evaluate fitness of all chromosomes in population
  private evaluatePopulation(): void {
    for (const chromosome of this.population) {
      chromosome.fitness = this.calculateFitness(chromosome);
    }

    // Sort population by fitness (higher is better)
    this.population.sort((a, b) => b.fitness - a.fitness);

    // Update best chromosome if needed
    if (!this.bestChromosome || this.population[0].fitness > this.bestChromosome.fitness) {
      this.bestChromosome = this.population[0].copy();
    }

    // Update fitness history
    this.fitnessHistory.push(this.bestChromosome.fitness);
  }

  // Calculate fitness score for a chromosome
  private calculateFitness(chromosome: Chromosome): number {
    // Start with a base score
    let fitness = 1000;
    
    // Violations tracking
    const hardViolations = {
      teacherConflicts: 0,
      classConflicts: 0,
      roomTypeViolations: 0
    };
    
    const softViolations = {
      teacherPreferenceViolations: 0,
      workloadImbalance: 0
    };

    // Check for conflicts
    // For each time slot, track teachers, classes, and rooms in use
    const timeSlotMap: Map<number, { teachers: Set<number>, classes: Set<number>, rooms: Set<number> }> = new Map();
    
    for (const lesson of chromosome.lessons) {
      if (!timeSlotMap.has(lesson.timeSlotId)) {
        timeSlotMap.set(lesson.timeSlotId, { 
          teachers: new Set(), 
          classes: new Set(), 
          rooms: new Set() 
        });
      }

      const timeSlotData = timeSlotMap.get(lesson.timeSlotId)!;
      
      // HARD CONSTRAINT: Teacher can't be in two places at once
      if (this.params.hardConstraints.teacherConflict && timeSlotData.teachers.has(lesson.teacherId)) {
        hardViolations.teacherConflicts++;
      }
      
      // HARD CONSTRAINT: Class can't have two lessons at once
      if (this.params.hardConstraints.classConflict && timeSlotData.classes.has(lesson.classId)) {
        hardViolations.classConflicts++;
      }
      
      // HARD CONSTRAINT: Room can't have two classes at once
      if (timeSlotData.rooms.has(lesson.roomId)) {
        // This is always a hard constraint
        hardViolations.teacherConflicts++; // Count as a teacher conflict for simplicity
      }
      
      // HARD CONSTRAINT: Subject must be in appropriate room type
      if (this.params.hardConstraints.roomTypeMatch) {
        const subject = this.resources.subjects.find(s => s.id === lesson.subjectId);
        const room = this.resources.rooms.find(r => r.id === lesson.roomId);
        
        if (subject && room && subject.roomType !== room.type) {
          hardViolations.roomTypeViolations++;
        }
      }
      
      // Update sets for this time slot
      timeSlotData.teachers.add(lesson.teacherId);
      timeSlotData.classes.add(lesson.classId);
      timeSlotData.rooms.add(lesson.roomId);
    }
    
    // Check teacher availability (SOFT CONSTRAINT)
    if (this.params.softConstraints.teacherPreference) {
      for (const lesson of chromosome.lessons) {
        const availability = this.resources.teacherAvailability.find(
          ta => ta.teacherId === lesson.teacherId && ta.timeSlotId === lesson.timeSlotId
        );
        
        if (availability && !availability.isAvailable) {
          softViolations.teacherPreferenceViolations++;
        }
      }
    }
    
    // Check workload distribution (SOFT CONSTRAINT)
    if (this.params.softConstraints.workloadDistribution) {
      const teacherWorkload: Map<number, number> = new Map();
      
      for (const lesson of chromosome.lessons) {
        const currentLoad = teacherWorkload.get(lesson.teacherId) || 0;
        teacherWorkload.set(lesson.teacherId, currentLoad + 1);
      }
      
      // Calculate average workload
      const workloads = Array.from(teacherWorkload.values());
      if (workloads.length > 0) {
        const avgWorkload = workloads.reduce((sum, load) => sum + load, 0) / workloads.length;
        
        // Sum of squared deviations from average
        const workloadVariance = workloads.reduce(
          (sum, load) => sum + Math.pow(load - avgWorkload, 2), 0
        );
        
        softViolations.workloadImbalance = Math.sqrt(workloadVariance); // Use standard deviation as a measure
      }
    }
    
    // Apply penalties for violations
    // Hard constraints have heavy penalties
    const hardPenalty = 100;
    fitness -= hardViolations.teacherConflicts * hardPenalty;
    fitness -= hardViolations.classConflicts * hardPenalty;
    fitness -= hardViolations.roomTypeViolations * hardPenalty;
    
    // Soft constraints have lighter penalties
    const softPenalty = 10;
    fitness -= softViolations.teacherPreferenceViolations * softPenalty;
    fitness -= softViolations.workloadImbalance * softPenalty;
    
    // Ensure fitness doesn't go below zero
    return Math.max(0, fitness);
  }

  // Run the evolution process
  evolve(): boolean {
    if (this.currentGeneration >= this.params.generationCount) {
      return false; // Evolution complete
    }

    // Create a new generation
    const newPopulation: Chromosome[] = [];
    
    // Elitism: Keep the best chromosomes
    for (let i = 0; i < this.params.elitismCount; i++) {
      newPopulation.push(this.population[i].copy());
    }
    
    // Fill the rest with offspring
    while (newPopulation.length < this.params.populationSize) {
      // Selection
      const parent1 = this.tournamentSelection();
      const parent2 = this.tournamentSelection();
      
      // Crossover with probability
      let offspring1 = parent1.copy();
      let offspring2 = parent2.copy();
      
      if (Math.random() < this.params.crossoverRate) {
        [offspring1, offspring2] = this.crossover(parent1, parent2);
      }
      
      // Mutation with probability
      if (Math.random() < this.params.mutationRate) {
        this.mutate(offspring1);
      }
      
      if (Math.random() < this.params.mutationRate) {
        this.mutate(offspring2);
      }
      
      // Add offspring to new population
      newPopulation.push(offspring1);
      if (newPopulation.length < this.params.populationSize) {
        newPopulation.push(offspring2);
      }
    }
    
    // Replace population
    this.population = newPopulation;
    
    // Evaluate new population
    this.evaluatePopulation();
    
    this.currentGeneration++;
    return true; // Continue evolution
  }

  // Tournament selection
  private tournamentSelection(): Chromosome {
    // Select random chromosomes for tournament
    const tournamentSize = Math.min(this.params.tournamentSize, this.population.length);
    const tournament: Chromosome[] = [];
    
    for (let i = 0; i < tournamentSize; i++) {
      const randomIndex = Math.floor(Math.random() * this.population.length);
      tournament.push(this.population[randomIndex]);
    }
    
    // Find the best in tournament
    return tournament.reduce(
      (best, current) => current.fitness > best.fitness ? current : best,
      tournament[0]
    );
  }

  // Crossover between two parents
  private crossover(parent1: Chromosome, parent2: Chromosome): [Chromosome, Chromosome] {
    const lessons1 = parent1.lessons;
    const lessons2 = parent2.lessons;
    
    // Make sure both parents have lessons
    if (lessons1.length === 0 || lessons2.length === 0) {
      return [parent1.copy(), parent2.copy()];
    }
    
    // Uniform crossover point
    const crossoverPoint = Math.floor(Math.random() * Math.min(lessons1.length, lessons2.length));
    
    // Create offspring by swapping segments
    const offspring1Lessons = [
      ...lessons1.slice(0, crossoverPoint),
      ...lessons2.slice(crossoverPoint)
    ];
    
    const offspring2Lessons = [
      ...lessons2.slice(0, crossoverPoint),
      ...lessons1.slice(crossoverPoint)
    ];
    
    return [
      new Chromosome(offspring1Lessons),
      new Chromosome(offspring2Lessons)
    ];
  }

  // Mutate a chromosome
  private mutate(chromosome: Chromosome): void {
    if (chromosome.lessons.length === 0) return;
    
    // Select a random lesson
    const lessonIndex = Math.floor(Math.random() * chromosome.lessons.length);
    const lesson = chromosome.lessons[lessonIndex];
    
    // Choose a mutation type
    const mutationType = Math.floor(Math.random() * Object.keys(MutationType).length / 2);
    
    switch (mutationType) {
      case MutationType.CHANGE_ROOM:
        this.mutateRoom(lesson);
        break;
      case MutationType.CHANGE_TIME:
        this.mutateTimeSlot(lesson);
        break;
      case MutationType.CHANGE_TEACHER:
        this.mutateTeacher(lesson);
        break;
      case MutationType.SWAP_TIMESLOTS:
        // Find another random lesson
        const otherIndex = Math.floor(Math.random() * chromosome.lessons.length);
        if (otherIndex !== lessonIndex) {
          const otherLesson = chromosome.lessons[otherIndex];
          // Swap time slots
          const tempTimeSlot = lesson.timeSlotId;
          lesson.timeSlotId = otherLesson.timeSlotId;
          otherLesson.timeSlotId = tempTimeSlot;
        }
        break;
    }
  }

  // Mutate the room of a lesson
  private mutateRoom(lesson: Lesson): void {
    const subject = this.resources.subjects.find(s => s.id === lesson.subjectId);
    if (!subject) return;
    
    // Get eligible rooms for this subject
    const eligibleRooms = this.resources.rooms
      .filter(r => r.type === subject.roomType)
      .map(r => r.id);
    
    if (eligibleRooms.length === 0) return;
    
    // Assign a new random room
    lesson.roomId = this.getRandomElement(eligibleRooms);
  }

  // Mutate the time slot of a lesson
  private mutateTimeSlot(lesson: Lesson): void {
    if (this.resources.timeSlots.length === 0) return;
    
    // Assign a new random time slot
    lesson.timeSlotId = this.getRandomElement(this.resources.timeSlots.map(ts => ts.id));
  }

  // Mutate the teacher of a lesson
  private mutateTeacher(lesson: Lesson): void {
    // Find eligible teachers for this subject
    const eligibleTeachers = this.resources.teacherSubjects
      .filter(ts => ts.subjectId === lesson.subjectId)
      .map(ts => ts.teacherId);
    
    if (eligibleTeachers.length === 0) return;
    
    // Assign a new random teacher
    lesson.teacherId = this.getRandomElement(eligibleTeachers);
  }

  // Get current progress
  getProgress(): { 
    currentGeneration: number, 
    totalGenerations: number, 
    bestFitness: number,
    fitnessHistory: number[]
  } {
    return {
      currentGeneration: this.currentGeneration,
      totalGenerations: this.params.generationCount,
      bestFitness: this.bestChromosome?.fitness || 0,
      fitnessHistory: this.fitnessHistory
    };
  }

  // Get the best schedule found
  getBestSchedule(): ScheduleDetail[] {
    if (!this.bestChromosome) return [];
    
    // Convert internal lessons to ScheduleDetail format
    // We leave scheduleId unset - it should be assigned by the caller
    return this.bestChromosome.lessons.map(lesson => ({
      id: 0, // Will be assigned by database
      scheduleId: 0, // Will be set by caller
      classId: lesson.classId,
      subjectId: lesson.subjectId,
      teacherId: lesson.teacherId,
      roomId: lesson.roomId,
      timeSlotId: lesson.timeSlotId,
      isManuallyEdited: false,
      isOverride: false
    }));
  }

  // Get fitness score
  getBestFitness(): number {
    return this.bestChromosome?.fitness || 0;
  }
}
